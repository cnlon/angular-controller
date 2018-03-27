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
        return this.$scope.$on(...args)
    }
    ScopeController.prototype.$on = $on
}


module.exports = on
