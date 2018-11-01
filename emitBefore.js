import AngularController from './AngularController'
import {hook} from './_common'
import './emit'

function emitBefore (name, ...args) {
    return function doEmitBefore (methodDescriptor) {
        return hook(methodDescriptor, oldMethod => {
            return function (...thisArgs) {
                this.$emit(name, ...args)
                return oldMethod.call(this, ...thisArgs)
            }
        })
    }
}

AngularController.emitBefore = emitBefore

export default emitBefore
