import AngularController from './AngularController'
import {hook} from './_common'

function $broadcast (...args) {
    return this.$scope.$broadcast(...args)
}

function broadcast (name, ...args) {
    return function doBroadcast (methodDescriptor) {
        return hook(methodDescriptor, oldMethod => {
            return function (...thisArgs) {
                const result = oldMethod.call(this, ...thisArgs)
                this.$broadcast(name, ...args, result)
                return result
            }
        })
    }
}

AngularController.prototype.$broadcast = $broadcast
AngularController.broadcast = broadcast

export default broadcast
