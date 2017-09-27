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
    const descriptors = Object.getOwnPropertyDescriptors(state)
    for (const [key, descriptor] of Object.entries(descriptors)) {
        if (!descriptor.configurable) {
            continue
        }
        this.$set(key, descriptor)
    }
}

function setMethod (key, descriptor) {
    if (descriptor.hasOwnProperty('value')) {
        const {value} = descriptor
        if (typeof value === 'function') {
            descriptor.value = this::value
        } else {
            descriptor = {
                get () {
                    return value
                },
                enumerable: true,
                configurable: true,
            }
        }
    } else {
        const {get: getter, set: setter} = descriptor
        if (getter) {
            descriptor.get = this::getter
        }
        if (setter) {
            descriptor.set = this::setter
        }
    }
    Object.defineProperty(this.$scope, key, descriptor)
}
function resolveMethods () {
    let {prototype} = this.constructor
    do {
        const descriptors = Object.getOwnPropertyDescriptors(prototype)
        for (const [key, descriptor] of Object.entries(descriptors)) {
            if (key === 'constructor' || key.startsWith('$')) {
                continue
            }
            if (!descriptor.configurable) {
                continue
            }
            this::setMethod(key, descriptor)
        }
        prototype = Object.getPrototypeOf(prototype)
    } while (prototype && prototype.constructor !== Object)
}


class ScopeController {

    /**
     * @param {Object} prototype
     * @param {function} callback
     * @param {string} [phase='after']
     * @return
     */

    static $$todo (prototype, callback, phase = 'after') {
        phase = '$$' + phase
        if (!prototype.hasOwnProperty(phase)) {
            let todo = prototype[phase] // inherited
            if (todo) {
                todo = todo.filter(({selfish}) => !selfish)
            } else {
                todo = []
            }
            Object.defineProperty(prototype, phase, {value: todo})
        }
        prototype[phase].push(callback)
    }

    constructor (...args) {
        this::todo('before', ...args)
        this::resolveState(...args)
        if (!this.$scope) {
            return
        }
        if (process.env.NODE_ENV === 'development') {
            Object.defineProperty(this.$scope, '$$scopeController', {
                value: this,
                configurable: true
            })
        }
        this::resolveMethods()
        this::todo('after')
    }

    /**
     * @param {string} key
     * @param {any} descriptor
     * @return {boolean}
     */

    $set (key, descriptor) {
        const targetDescriptor = Object.getOwnPropertyDescriptor(this, key)
        if (targetDescriptor && !targetDescriptor.configurable) {
            return false
        }

        if (descriptor === null || typeof descriptor !== 'object') {
            descriptor = {
                value: descriptor,
                writable: true,
                enumerable: true,
                configurable: true
            }
        }

        const scope = this.$scope
        if (!scope) {
            Object.defineProperty(this, key, descriptor)
            return false
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
            enumerable: Boolean(descriptor.enumerable),
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

        return true
    }
}


module.exports = ScopeController
