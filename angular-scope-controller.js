(function (root, factory) {
    if (typeof exports === 'object' && typeof exports.nodeName !== 'string') {
        factory(exports, require('angular'));
    } else {
        factory(root, root.angular);
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

            const toWatch = prototype.$$toWatch
            if (!toWatch) {
                return
            }
            const unwatches = {}
            for (const [key, options] of Object.entries(toWatch)) {
                unwatches[key] = this.$watch(...options.expressions, options)
            }
            Object.defineProperty(this, '$$unwatches', {
                value: unwatches
            })
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
                const unwatch = unwatches[name]
                if (unwatch) {
                    unwatch()
                    delete unwatches[name]
                }
            }
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

    function watch (...args) {
        const expressions = args
        const options = {
            expressions,
            callback: undefined,
            deep: undefined,
            strict: undefined
        }
        const lastArg = expressions[args.length - 1]
        if (lastArg === true || lastArg === false) {
            options.deep = lastArg
            expressions.pop()
        } else if (angular.isObject(lastArg)) {
            options.deep = lastArg.deep
            options.strict = lastArg.strict
            expressions.pop
        }
        return function registerWatch (prototype, property, descriptor) {
            options.callback = descriptor.value
            if (!prototype['$$toWatch']) {
                Object.defineProperty(prototype, '$$toWatch', {
                    value: Object.create(null),
                    configurable: true
                })
            }
            prototype['$$toWatch'][property] = options
        }
    }

    exports.ScopeController = angular.ScopeController = ScopeController
    exports.inject = ScopeController.inject = inject
    exports.watch = ScopeController.watch = watch
}));
