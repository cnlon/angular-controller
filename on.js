import ScopeController from './ScopeController'

const todo = ScopeController.$$todo

function $on (...args) {
    return this.$scope.$on(...args)
}

function on (name) {
    return function toOn (prototype, property) {
        function doOn () {
            this.$on(name, (...args) => this[property](...args))
        }
        todo(prototype, doOn)
    }
}

ScopeController.prototype.$on = $on
ScopeController.on = on

export default on
