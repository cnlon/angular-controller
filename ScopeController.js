// utils

function makeGetter (key) {
    return function getter () {
        if (process.env.NODE_ENV === 'development') {
            if (!this.$scope) {
                throw new Error('Should inject $scope to Controller!')
            }
        }
        return this.$scope[key]
    }
}
function makeSetter (key) {
    return function setter (value) {
        if (process.env.NODE_ENV === 'development') {
            if (!this.$scope) {
                throw new Error('Should inject $scope to Controller!')
            }
        }
        this.$scope[key] = value
    }
}

function write (target, key, value) {
    if (process.env.NODE_ENV === 'development') {
        const descriptor = Object.getOwnPropertyDescriptor(target, key)
        if (descriptor && !descriptor.writable && !descriptor.set) {
            console.warn(`Can not assign ${value} to ${target}.${key}!`)
            return
        }
    }
    target[key] = value
}

function forEachConfigurableDescriptor (target, callback) {
    const descriptors = Object.getOwnPropertyDescriptors(target)
    for (const [key, descriptor] of Object.entries(descriptors)) {
        if (!descriptor.configurable) {
            continue
        }
        callback(key, descriptor)
    }
}


// private methods

function todo (phase, ...args) {
    const todo = this.constructor.prototype['$$' + phase]
    if (!todo) {
        return
    }
    for (const callback of todo) {
        this::callback(...args)
    }
}

function resolveState (...args) {
    const state = this.$onState && this.$onState(...args)
    if (!state) {
        return
    }
    const scope = this.$scope
    if (!scope) {
        // assign state
        forEachConfigurableDescriptor(state, (key, descriptor) => {
            Object.defineProperty(this, key, descriptor)
        })
        return
    }
    // proxy state
    forEachConfigurableDescriptor(state, (key, descriptor) => {
        const targetDescriptor = Object.getOwnPropertyDescriptor(this, key)
        if (targetDescriptor && !targetDescriptor.configurable) {
            return
        }
        let getter, setter
        if (descriptor.hasOwnProperty('value')) {
            getter = makeGetter(key)
            setter = makeSetter(key)
        } else {
            getter = descriptor.get && makeGetter(key)
            setter = descriptor.set && makeSetter(key)
        }
        Object.defineProperty(this, key, {
            get: getter,
            set: setter,
            enumerable: descriptor.enumerable,
            configurable: true
        })

        if (scope.hasOwnProperty(key)) {
            if (scope[key] === undefined) {
                write(scope, key, this[key])
            } else {
                write(this, key, scope[key])
            }
        } else {
            Object.defineProperty(scope, key, descriptor)
        }
    })
}

function resolveMethods () {
    const scope = this.$scope
    const {prototype} = this.constructor
    forEachConfigurableDescriptor(prototype, (key, descriptor) => {
        if (key === 'constructor' || key.startsWith('$')) {
            return
        }
        const {value} = descriptor
        if (typeof value === 'function') {
            descriptor.value = this::value
        } else {
            const {get: getter, set: setter} = descriptor
            if (getter) {
                descriptor.get = this::getter
            }
            if (setter) {
                descriptor.set = this::setter
            }
        }
        Object.defineProperty(scope, key, descriptor)
    })
}


class ScopeController {
    static $$todo (prototype, callback, phase = 'after') {
        phase = '$$' + phase
        if (!prototype.hasOwnProperty(phase)) {
            Object.defineProperty(prototype, phase, {value: []})
        }
        const todo = prototype[phase]
        todo.push(callback)
    }

    constructor (...args) {
        this::todo('before', ...args)
        this::resolveState(...args)
        if (!this.$scope) {
            return
        }
        if (process.env.NODE_ENV === 'development') {
            Object.defineProperty(this.$scope, '$$scopeController', {value: this})
        }
        this::resolveMethods()
        this::todo('after')
    }
}


module.exports = ScopeController
