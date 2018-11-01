import AngularController from './AngularController'

function $emit (...args) {
    return this.$scope.$emit(...args)
}

function emit (name, ...args) {
    return function toEmit (prototype, key, descriptor) {
        let oldMethod
        const newMethod = function (...thisArgs) {
            const result = oldMethod.call(this, ...thisArgs)
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

AngularController.prototype.$emit = $emit
AngularController.emit = emit

export default emit
