import AngularController from './AngularController'
import {hook} from './_common'

function $emit (...args) {
    return this.$scope.$emit(...args)
}

function emit (name, ...args) {
    return function doEmit (methodDescriptor) {
        return hook(methodDescriptor, oldMethod => {
            return function (...thisArgs) {
                const result = oldMethod.call(this, ...thisArgs)
                this.$emit(name, ...args, result)
                return result
            }
        })
    }
}

AngularController.prototype.$emit = $emit
AngularController.emit = emit

export default emit
