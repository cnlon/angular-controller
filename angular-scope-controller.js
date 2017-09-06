(function (root, factory) {
    if (typeof exports === 'object' && typeof exports.nodeName !== 'string') {
        factory(exports, require('angular'))
    } else {
        factory(root, root.angular)
    }
}(this, function (exports, angular) {

    const hasOwnProperty = Object.prototype.hasOwnProperty

    class ScopeController {
        constructor (...args) {
            const {$inject: inject, prototype} = this.constructor
            if (inject) {
                inject.forEach((key, index) => this[key] = args[index])
            }

            const state = this.$onState && this.$onState(...args)
            const scope = this.$scope
            if (state) {
                if (scope) {
                    proxyState(this, state)
                } else {
                    assignState(this, state)
                }
            }

            if (!scope) {
                return
            }

            const toWatch = prototype.$$toWatch

            if (process.env.NODE_ENV === 'development') {
                Object.defineProperty(scope, '$$scopeController', {value: this})
            }

            const descriptors = Object.getOwnPropertyDescriptors(prototype)
            const toAssignDescriptors = {}
            for (const [key, descriptor] of Object.entries(descriptors)) {
                if (key === 'constructor' || key.startsWith('$')) {
                    continue
                }
                if (angular.isFunction(descriptor.value)) {
                    descriptor.value = this::descriptor.value
                } else {
                    const isComputed = toWatch
                        && toWatch.includes(({property}) => property === key)
                    if (isComputed) {
                        continue
                    }
                    if (angular.isFunction(descriptor.get)) {
                        descriptor.get = this::descriptor.get
                    }
                    if (angular.isFunction(descriptor.set)) {
                        descriptor.set = this::descriptor.set
                    }
                }
                toAssignDescriptors[key] = descriptor
            }
            assign(scope, toAssignDescriptors)

            if (toWatch) {
                const unwatches = []
                const toAssignComputedDescriptors = {}
                for (const options of toWatch) {
                    const {callback, property} = options
                    if (angular.isFunction(callback)) {
                        const unwatch = this.$watch(...options.expressions, options)
                        unwatches.push({
                            property,
                            unwatch
                        })
                        continue
                    }
                    // computed property
                    const {get: getter, set: setter} = callback
                    const commputed = makeComputed(this, getter, options)
                    options.callback = commputed
                    this.$watch(...options.expressions, options)
                    Object.defineProperty(this, property, {
                        get: commputed,
                        set: setter,
                        enumerable: true
                    })
                    toAssignComputedDescriptors[property] = {
                        get: commputed,
                        set: angular.isFunction(setter) ? this::setter : undefined,
                        enumerable: true
                    }
                }
                Object.defineProperty(this, '$$unwatches', {
                    value: unwatches,
                    writable: true
                })
                assign(scope, toAssignComputedDescriptors)
            }

            const toListen = prototype.$$toListen
            if (toListen) {
                for (const {name, property} of toListen) {
                    this.$on(name, (...args) => this[property](...args))
                }
            }
        }

        $watch (...args) {
            const options = args.pop()
            const expressions = args
            let callback, deep, strict
            if (angular.isFunction(options)) {
                callback = this::options
            } else {
                callback = this::options.callback
                deep = options.deep
                strict = options.strict
            }

            const scope = this.$scope
            if (expressions.length > 1) {
                return scope.$watchGroup(expressions, callback)
            }
            const [expression] = expressions
            if (deep) {
                return scope.$watchCollection(expression, callback)
            } else if (strict ) {
                return scope.$watch(expression, callback, true)
            } else {
                return scope.$watch(expression, callback)
            }
        }

        $unwatch (...names) {
            const unwatches = this.$$unwatches
            if (!unwatches) {
                return
            }
            for (const name of names) {
                this.$$unwatches = unwatches.filter(({property, unwatch}) => {
                    if (name !== property) {
                        return true
                    }
                    unwatch()
                    return false
                })
            }
        }

        $on (...args) {
            if (process.env.NODE_ENV === 'development') {
                if (!this.$scope) {
                    throw new Error('Should inject $scope to Controller!')
                }
            }
            return this.$scope.$on(...args)
        }

        $emit (...args) {
            if (process.env.NODE_ENV === 'development') {
                if (!this.$scope) {
                    throw new Error('Should inject $scope to Controller!')
                }
            }
            return this.$scope.$emit(...args)
        }

        $broadcast (...args) {
            if (process.env.NODE_ENV === 'development') {
                if (!this.$scope) {
                    throw new Error('Should inject $scope to Controller!')
                }
            }
            return this.$scope.$broadcast(...args)
        }
    }

    function makeGetter (key) {
        return function getter () {
            if (process.env.NODE_ENV === 'development') {
                if (!this.$scope) {
                    throw new Error('Should inject $scope to Controller!')
                }
            }
            return this.$scope[key]
        }
    }
    function makeSetter (key) {
        return function setter (value) {
            if (process.env.NODE_ENV === 'development') {
                if (!this.$scope) {
                    throw new Error('Should inject $scope to Controller!')
                }
            }
            this.$scope[key] = value
        }
    }

    function write (target, key, value) {
        const descriptor = Object.getOwnPropertyDescriptor(target, key)
        if (process.env.NODE_ENV === 'development') {
            if (descriptor && !descriptor.writable && !descriptor.set) {
                console.warn(`Can not assign ${value} to ${target}.${key}!`)
                return
            }
        }
        target[key] = value
    }

    function proxyState (target, state) {
        const {$scope} = target
        const descriptors = Object.getOwnPropertyDescriptors(state)
        for (const [key, descriptor] of Object.entries(descriptors)) {
            const targetDescriptor = Object.getOwnPropertyDescriptor(target, key)
            if (targetDescriptor && !targetDescriptor.configurable) {
                continue
            }
            let getter, setter
            if (descriptor::hasOwnProperty('value')) {
                getter = makeGetter(key)
                setter = makeSetter(key)
            } else {
                getter = descriptor.get && makeGetter(key)
                setter = descriptor.set && makeSetter(key)
            }
            Object.defineProperty(target, key, {
                get: getter,
                set: setter,
                enumerable: true
            })

            if ($scope::hasOwnProperty(key)) {
                if ($scope[key] === undefined) {
                    write($scope, key, target[key])
                } else {
                    write(target, key, $scope[key])
                }
            } else {
                Object.defineProperty(target.$scope, key, descriptor)
            }
        }
    }

    function assign (target, descriptors) {
        for (const [key, descriptor] of Object.entries(descriptors)) {
            const targetDescriptor = Object.getOwnPropertyDescriptor(target, key)
            if (targetDescriptor && !targetDescriptor.configurable) {
                continue
            }
            Object.defineProperty(target, key, descriptor)
        }
    }

    function assignState (target, state) {
        const descriptors = Object.getOwnPropertyDescriptors(state)
        assign(target, descriptors)
    }


    function inject (...args) {
        return function doInject (target) {
            target.$inject = args
            return target
        }
    }

    function makeComputed (target, getter, {sync}) {
        let value
        const evaluate = () => value = target::getter()
        if (sync) {
            return function commputed () {
                if (arguments.length === 0) {
                    return value
                }
                evaluate()
            }
        }
        let dirty = true
        return function commputed () {
            if (arguments.length === 0) {
                if (dirty) {
                    evaluate()
                    dirty = false
                }
                return value
            }
            dirty = true
        }
    }

    function watch (...args) {
        const expressions = args
        const options = {
            property: '',
            expressions,
            callback: null,
            deep: false,
            strict: false,
            sync: false,
        }
        return function registerWatch (prototype, property, descriptor) {
            options.property = property
            const lastArg = expressions[args.length - 1] || false
            const toWatch = descriptor::hasOwnProperty('value')
            if (lastArg === true || lastArg === false) {
                if (toWatch) {
                    options.deep = lastArg
                } else {
                    options.sync = lastArg
                }
                expressions.pop()
            } else if (angular.isObject(lastArg)) {
                angular.merge(options, lastArg)
                expressions.pop
            }
            if (toWatch) {
                options.callback = descriptor.value
            } else {
                options.callback = {
                    get: descriptor.get,
                    set: descriptor.set,
                }
            }
            if (!prototype['$$toWatch']) {
                Object.defineProperty(prototype, '$$toWatch', {
                    value: [],
                    configurable: true
                })
            }
            prototype['$$toWatch'].push(options)
        }
    }

    function on (name) {
        return function toOn (prototype, property) {
            if (!prototype['$$toListen']) {
                Object.defineProperty(prototype, '$$toListen', {
                    value: [],
                    configurable: true
                })
            }
            prototype['$$toListen'].push({
                name,
                property,
            })
        }
    }

    function emit (name, ...args) {
        return function toEmit (prototype, property, descriptor) {
            let oldMethod
            const newMethod = function (...thisArgs) {
                const result = this::oldMethod(...thisArgs)
                this.$emit(name, ...args, result)
                return result
            }
            if (descriptor.value) {
                oldMethod = descriptor.value
                descriptor.value = newMethod
            } else if (descriptor.set) {
                oldMethod = descriptor.set
                descriptor.set = newMethod
            }
        }
    }

    function broadcast (name, ...args) {
        return function toBroadcast (prototype, property, descriptor) {
            let oldMethod
            const newMethod = function (...thisArgs) {
                const result = this::oldMethod(...thisArgs)
                this.$broadcast(name, ...args, result)
                return result
            }
            if (descriptor.value) {
                oldMethod = descriptor.value
                descriptor.value = newMethod
            } else if (descriptor.set) {
                oldMethod = descriptor.set
                descriptor.set = newMethod
            }
        }
    }

    exports.ScopeController = angular.ScopeController = ScopeController
    exports.inject = ScopeController.inject = inject
    exports.watch = ScopeController.watch = watch
    exports.on = ScopeController.on = on
    exports.emit = ScopeController.emit = emit
    exports.broadcast = ScopeController.broadcast = broadcast
}));
