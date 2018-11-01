import AngularController from './AngularController'
import {hook} from './_common'
import './broadcast'

function broadcastBefore (name, ...args) {
    return function doBroadcastBefore (methodDescriptor) {
        return hook(methodDescriptor, oldMethod => {
            return function (...thisArgs) {
                this.$broadcast(name, ...args)
                return oldMethod.call(this, ...thisArgs)
            }
        })
    }
}

AngularController.broadcastBefore = broadcastBefore

export default broadcastBefore
