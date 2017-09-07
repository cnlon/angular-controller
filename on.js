let todo

function on (name) {
    return function toOn (prototype, property) {
        function doOn () {
            this.$on(name, (...args) => this[property](...args))
        }
        todo(prototype, doOn)
    }
}

on.install = function (ScopeController) {
    todo = ScopeController.$$todo
    function $on (...args) {
        if (process.env.NODE_ENV === 'development') {
            if (!this.$scope) {
                throw new Error('Should inject $scope to Controller!')
            }
        }
        return this.$scope.$on(...args)
    }
    ScopeController.prototype.$on = $on
}


module.exports = on
