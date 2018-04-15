function broadcast (name, ...args) {
    return function toBroadcast (prototype, key, descriptor) {
        let oldMethod
        const newMethod = function (...thisArgs) {
            const result = oldMethod.call(this, ...thisArgs)
            this.$broadcast(name, ...args, result)
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

broadcast.install = function (ScopeController) {
    function $broadcast (...args) {
        return this.$scope.$broadcast(...args)
    }
    ScopeController.prototype.$broadcast = $broadcast
    ScopeController.broadcast = broadcast
}


module.exports = broadcast
