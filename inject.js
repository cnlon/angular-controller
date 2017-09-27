let todo

function inject (...services) {
    return function toInject (Controller) {
        if (Array.isArray(Controller.$inject)) {
            services.push(...Controller.$inject)
            services = Array.from(new Set(services))
        }
        Controller.$inject = services

        function doInject (...args) {
            services.forEach((name, index) => {
                this[name] = args[index]
            })
        }

        todo(Controller.prototype, doInject, 'before')
    }
}

inject.install = function (ScopeController) {
    todo = ScopeController.$$todo
    ScopeController.inject = inject
}


module.exports = inject
