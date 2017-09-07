function broadcastBefore (name, ...args) {
    return function toBroadcastBefore (prototype, key, descriptor) {
        let oldMethod
        const newMethod = function (...thisArgs) {
            this.$broadcast(name, ...args)
            return this::oldMethod(...thisArgs)
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


module.exports = broadcastBefore