let todo

function makeComputed (target, getter, sync) {
    let value
    const evaluate = () => {
        value = target::getter()
    }
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

function watch (...expressions) {
    let deep = false
    let strict = false
    let sync = false
    return function toWatch (prototype, property, descriptor) {
        const toWatch = descriptor::hasOwnProperty('value')
        const lastArg = expressions[expressions.length - 1] || false
        if (typeof lastArg === 'boolean') {
            if (toWatch) {
                deep = lastArg
            } else {
                sync = lastArg
            }
            expressions.pop()
        } else if (typeof lastArg === 'object' && lastArg !== null) {
            deep = Boolean(lastArg.deep)
            strict = Boolean(lastArg.strict)
            sync = Boolean(lastArg.sync)
            expressions.pop()
        }

        let doWatch
        if (toWatch) {
            doWatch = function watch () {
                this.$watch(...expressions, {
                    callback: descriptor.value,
                    deep,
                    strict
                })
            }
        } else {
            doWatch = function commpute () {
                const {get: getter, set: setter} = descriptor
                const commputed = makeComputed(this, getter, sync)
                this.$watch(...expressions, {
                    callback: commputed,
                    deep,
                    strict
                })
                if (process.env.NODE_ENV === 'development') {
                    if (!this.$scope) {
                        throw new Error('Should inject $scope to Controller!')
                    }
                }
                const scope = this.$scope
                if (scope.hasOwnProperty(property)) {
                    return
                }
                Object.defineProperty(scope, property, {
                    get: commputed,
                    set: setter ? this::setter : undefined,
                    enumerable: true,
                    configurable: true
                })
            }
            descriptor.configurable = false
        }
        todo(prototype, doWatch)
    }
}

watch.install = function (ScopeController) {
    todo = ScopeController.$$todo
    function $watch (...args) {
        const options = args.pop()
        const expressions = args
        let callback, deep, strict
        if (typeof options === 'function') {
            callback = this::options
            deep = false
            strict = false
        } else {
            callback = this::options.callback
            deep = Boolean(options.deep)
            strict = Boolean(options.strict)
        }

        if (process.env.NODE_ENV === 'development') {
            if (!this.$scope) {
                throw new Error('Should inject $scope to Controller!')
            }
        }
        const scope = this.$scope
        if (expressions.length > 1) {
            return scope.$watchGroup(expressions, callback)
        }
        const [expression] = expressions
        if (deep) {
            return scope.$watchCollection(expression, callback)
        } else {
            return scope.$watch(expression, callback, strict)
        }
    }
    ScopeController.prototype.$watch = $watch
}


module.exports = watch
