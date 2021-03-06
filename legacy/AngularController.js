// utils

function makeGetter (key) {
    return function getter () {
        return this.$scope[key]
    }
}
function makeSetter (key) {
    return function setter (value) {
        this.$scope[key] = value
    }
}

function write (target, key, value) {
    if (process.env.NODE_ENV === 'development') {
        const descriptor = Object.getOwnPropertyDescriptor(target, key)
        if (descriptor && !descriptor.writable && !descriptor.set) {
            console.warn(`angular-controller: Can not assign ${value} to ${target}.${key}!`)
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
        callback.call(this, ...args)
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
            descriptor.value = value.bind(this)
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
            descriptor.get = getter.bind(this)
        }
        if (setter) {
            descriptor.set = setter.bind(this)
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
            setMethod.call(this, key, descriptor)
        }
        prototype = Object.getPrototypeOf(prototype)
    } while (prototype && prototype.constructor !== Object)
}

class AngularController {

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
        todo.call(this, 'before', ...args)
        resolveState.call(this, ...args)
        if (!this.$scope) {
            if (process.env.NODE_ENV === 'development') {
                Object.defineProperty(this, '$scope', {
                    enumerable: false,
                    configurable: true,
                    get () {
                        throw new Error('angular-controller: Should inject $scope to Controller before!')
                    }
                })
            }
            return
        }
        if (process.env.NODE_ENV === 'development') {
            Object.defineProperty(this.$scope, '$$scopeController', {
                value: this,
                configurable: true
            })
        }
        resolveMethods.call(this)
        todo.call(this, 'after')
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
        const isValue = descriptor.hasOwnProperty('value')
        if (isValue) {
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
                const defaultValue = isValue
                    ? descriptor.value
                    : (descriptor.get && descriptor.get.call(this))
                write(scope, key, defaultValue)
            } else {
                write(this, key, scope[key])
            }
        } else {
            Object.defineProperty(scope, key, descriptor)
        }

        return true
    }
}

export default AngularController
