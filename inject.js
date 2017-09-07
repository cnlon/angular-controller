let todo

function inject (...services) {
    return function toInject (Controller) {
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
