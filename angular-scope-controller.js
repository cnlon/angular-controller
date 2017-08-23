(function (root, factory) {
    if (typeof exports === 'object' && typeof exports.nodeName !== 'string') {
        factory(exports, require('angular'));
    } else {
        factory((root.commonJsStrict = {}), root.angular);
    }
}(this, function (exports, angular) {

    const hasOwnProperty = Object.prototype.hasOwnProperty

    class ScopeController {
        constructor (...args) {
            const {$inject, prototype} = this.constructor
            if ($inject) {
                $inject.forEach((key, index) => this[key] = args[index])
            }

            const state = this.$onState && this.$onState(...args)
            if (state) {
                if (this.$scope) {
                    proxyState(this, state)
                } else {
                    assignState(this, state)
                }
            }

            if (this.$scope) {
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
                assign(this.$scope, toAssignDescriptors)

                Object.defineProperty(this.$scope, '$$scopeController', {
                    value: this
                })
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

    exports.ScopeController = angular.ScopeController = ScopeController
    exports.inject = angular.inject = inject
}));
