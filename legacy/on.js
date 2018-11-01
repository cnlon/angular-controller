import AngularController from './AngularController'

const todo = AngularController.$$todo

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

AngularController.prototype.$on = $on
AngularController.on = on

export default on
