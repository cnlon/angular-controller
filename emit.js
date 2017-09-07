function emit (name, ...args) {
    return function toEmit (prototype, key, descriptor) {
        let oldMethod
        const newMethod = function (...thisArgs) {
            const result = this::oldMethod(...thisArgs)
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

emit.install = function (ScopeController) {
    function $emit (...args) {
        if (process.env.NODE_ENV === 'development') {
            if (!this.$scope) {
                throw new Error('Should inject $scope to Controller!')
            }
        }
        return this.$scope.$emit(...args)
    }
    ScopeController.prototype.$emit = $emit
}


module.exports = emit
