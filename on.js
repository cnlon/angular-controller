import AngularController from './AngularController'
import {todo} from './_common'

function $on (...args) {
    return this.$scope.$on(...args)
}

function on (name) {
    return function doOn (methodDescriptor) {
        const {key} = methodDescriptor
        function afterOn () {
            this.$on(name, (...args) => this[key](...args))
        }
        return {
            ...methodDescriptor,
            finisher (Controller) {
                todo(Controller, afterOn)
            }
        }
    }
}

AngularController.prototype.$on = $on
AngularController.on = on

export default on
