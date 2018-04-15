import AngularController from './AngularController'

class ScopeController extends AngularController {
    constructor (...args) {
        super(...args)
        if (process.env !== 'development') {
            console.warn('angular-controller: `ScopeController` is deprecated! Use `AngularController instead please.')
        }
    }
}

export default ScopeController
