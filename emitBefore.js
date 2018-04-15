import ScopeController from './ScopeController'
import './emit'

function emitBefore (name, ...args) {
    return function toEmitBefore (prototype, key, descriptor) {
        let oldMethod
        const newMethod = function (...thisArgs) {
            this.$emit(name, ...args)
            return oldMethod.call(this, ...thisArgs)
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

ScopeController.emitBefore = emitBefore

export default emitBefore
