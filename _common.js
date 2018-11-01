/**
 * @param {object} methodDescriptor
 * @param {function} hooker
 * @return {object}
 */

export function hook (methodDescriptor, hooker) {
    const {descriptor} = methodDescriptor
    let newDescriptor = descriptor
    if (descriptor.value) {
        newDescriptor = {
            ...descriptor,
            value: hooker(descriptor.value)
        }
    } else if (descriptor.set) {
        newDescriptor = {
            ...descriptor,
            set: hooker(descriptor.set)
        }
    }
    return {
        ...methodDescriptor,
        descriptor: newDescriptor
    }
}

/**
 * @param {function} Controller
 * @param {function} callback
 * @param {string} [phase='after']
 * @return
 */

export function todo (Controller, callback, phase = 'after') {
    const {prototype} = Controller
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

/**
 * @param {AngularController} instance
 * @param {*} phase
 * @param {...any} args
 * @return
 */

export function finish (instance, phase, ...args) {
    phase = '$$' + phase
    const todo = instance.constructor.prototype[phase]
    if (!todo) {
        return
    }
    for (const callback of todo) {
        callback.call(instance, ...args)
    }
}
