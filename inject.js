import ScopeController from './ScopeController'

const todo = ScopeController.$$todo

function inject (...services) {
    return function toInject (Controller) {
        const inherited = Controller.$inject
        if (inherited) {
            services = Array.from(new Set([...inherited, ...services]))
        }

        Controller.$inject = services

        function doInject (...args) {
            services.forEach((name, index) => {
                this[name] = args[index]
            })
        }
        doInject.selfish = true

        todo(Controller.prototype, doInject, 'before')
    }
}

ScopeController.inject = inject

export default inject
