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
    let immediate, strict, deep, sync
    return function toWatch (prototype, property, descriptor) {
        const lastArg = expressions[expressions.length - 1] || false
        if (typeof lastArg === 'boolean') {
            immediate = lastArg
            strict = false
            deep = false
            sync = false
            expressions.pop()
        } else if (typeof lastArg === 'object' && lastArg !== null) {
            immediate = Boolean(lastArg.immediate)
            strict = Boolean(lastArg.strict)
            deep = Boolean(lastArg.deep)
            sync = Boolean(lastArg.sync)
            expressions.pop()
        }

        let doWatch
        if (descriptor::hasOwnProperty('value')) {
            doWatch = function watch () {
                this.$watch(...expressions, {
                    callback: descriptor.value,
                    immediate,
                    strict,
                    deep
                })
            }
        } else {
            doWatch = function commpute () {
                const {get: getter, set: setter} = descriptor
                const commputed = makeComputed(this, getter, sync)
                this.$watch(...expressions, {
                    callback: commputed,
                    immediate: true,
                    strict,
                    deep
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
        let callback, immediate, strict, deep
        if (typeof options === 'function') {
            callback = this::options
            immediate = false
            strict = false
            deep = false
        } else {
            callback = this::options.callback
            immediate = Boolean(options.immediate)
            strict = Boolean(options.strict)
            deep = Boolean(options.deep)
        }

        if (!immediate) {
            const originCallback = callback
            let isFirst = true
            callback = function (...args) {
                if (isFirst) {
                    isFirst = false
                    return
                }
                originCallback(...args)
            }
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
