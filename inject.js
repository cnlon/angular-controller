import AngularController from './AngularController'
import {todo} from './_common'

function inject (...services) {
    return function doInject (classDescriptor) {
        return {
            ...classDescriptor,
            finisher (Controller) {
                const inherited = Controller.$inject
                if (inherited) {
                    services = Array.from(new Set([...inherited, ...services]))
                }

                Controller.$inject = services

                function afterInject (...args) {
                    services.forEach((name, index) => {
                        this[name] = args[index]
                    })
                }
                afterInject.selfish = true

                todo(Controller, afterInject, 'before')
            }
        }
    }
}

AngularController.inject = inject

export default inject
