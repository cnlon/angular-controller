import ScopeController from './ScopeController'
import './broadcast'

function broadcastBefore (name, ...args) {
    return function toBroadcastBefore (prototype, key, descriptor) {
        let oldMethod
        const newMethod = function (...thisArgs) {
            this.$broadcast(name, ...args)
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

ScopeController.broadcastBefore = broadcastBefore

export default broadcastBefore
