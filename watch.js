import AngularController from './AngularController'
import {todo} from './_common'

function $watch (...args) {
    const options = args.pop()
    const expressions = args
    let immediate = false
    let strict = false
    let deep = false
    let callback
    if (typeof options === 'function') {
        callback = options.bind(this)
    } else {
        callback = options.callback.bind(this)
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

function _makeComputed (target, getter, sync) {
    let value
    const evaluate = () => {
        value = getter.call(target)
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
    let immediate = false
    let strict = false
    let deep = false
    let sync = false
    return function doWatch (methodDescriptor) {
        const lastArg = expressions[expressions.length - 1] || false
        if (typeof lastArg === 'boolean') {
            immediate = lastArg
            expressions.pop()
        } else if (typeof lastArg === 'object' && lastArg !== null) {
            immediate = Boolean(lastArg.immediate)
            strict = Boolean(lastArg.strict)
            deep = Boolean(lastArg.deep)
            sync = Boolean(lastArg.sync)
            expressions.pop()
        }

        const {descriptor, key} = methodDescriptor
        let afterWatch
        if (descriptor.hasOwnProperty('value')) {
            afterWatch = function watch () {
                this.$watch(...expressions, {
                    callback: descriptor.value,
                    immediate,
                    strict,
                    deep
                })
            }
        } else {
            afterWatch = function commpute () {
                const {get: getter, set: setter} = descriptor
                const commputed = _makeComputed(this, getter, sync)
                this.$watch(...expressions, {
                    callback: commputed,
                    immediate: true,
                    strict,
                    deep
                })
                const scope = this.$scope
                if (scope.hasOwnProperty(key)) {
                    return
                }
                Object.defineProperty(scope, key, {
                    get: commputed,
                    set: setter ? setter.bind(this) : undefined,
                    enumerable: true,
                    configurable: true
                })
            }
            descriptor.configurable = false
        }
        return {
            ...methodDescriptor,
            finisher (Controller) {
                todo(Controller, afterWatch)
            }
        }
    }
}

AngularController.prototype.$watch = $watch
AngularController.watch = watch

export default watch
