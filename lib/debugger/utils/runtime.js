const SUB_TYPES = [
    'array', 'null', 'node', 'regexp', 'date', 'map', 'set', 'iterator',
    'generator', 'error', 'promise', 'typedarray'
]

/**
 * parse console properties properly
 * @param  {*}             arg  any kind of primitive or object
 * @return {RemoteObject}       Mirror object referencing original JavaScript object.
 */
export function getConsoleArg (arg, scriptId = 1, returnByValue) {
    const type = typeof arg
    const subtype = getSubType(arg)

    if (type === 'undefined') {
        return { type }
    }

    /**
     * return primitives right away
     */
    if (type.match(/^(number|string|undefined|boolean)$/) || subtype === 'null' || (subtype === 'array' && returnByValue)) {
        return { type, value: arg }
    }

    const instanceName = arg.constructor.name
    let description = arg.stack ? arg.stack : instanceName
    const result = {
        className: instanceName,
        description,
        objectId: `{"injectedScriptId": 1, "id": ${scriptId} }`,
        type
    }

    /**
     * apply subtype based on instance name
     */
    if (subtype) {
        result.subtype = subtype
    }

    /**
     * enhance array description
     */
    if (subtype === 'array') {
        result.description += `(${arg.length})`
    }

    /**
     * apply preview for raw objects only
     */
    if (type === 'object' && result.subtype !== 'node' && result.subtype !== 'error') {
        result.preview = {
            description: result.description,
            overflow: false,
            properties: getObjectProperties(arg),
            type
        }

        if (subtype === 'array') {
            result.preview.subtype = subtype
        }
    }

    return result
}

export function getObjectProperties (obj, includeDescriptors = false) {
    const objSubtype = getSubType(obj)
    return Object.getOwnPropertyNames(obj).map((propertyName) => {
        const descriptor = Object.getOwnPropertyDescriptor(obj, propertyName)
        const subtype = getSubType(descriptor.value)

        if (objSubtype === 'array' && (propertyName === 'length' || propertyName === 'constructor')) {
            return
        }

        let value
        let className
        if (subtype === 'node') {
            value = descriptor.value.nodeName.toLowerCase()
            className = descriptor.value.constructor.name

            if (descriptor.value.id) {
                value += `#${descriptor.value.id}`
            }

            if (descriptor.value.className) {
                value += `.${descriptor.value.className.replace(' ', '.')}`
            }
        } else {
            try {
                /**
                 * make sure we don' stringify empty string to `""""`
                 */
                value = descriptor.value ? JSON.stringify(descriptor.value) : ''
            } catch (e) {
                value = descriptor.value.toString()
            }
        }

        const result = {
            className,
            name: propertyName,
            type: typeof descriptor.value,
            value,
            subtype
        }

        if (!includeDescriptors) {
            return result
        }

        return {
            configurable: descriptor.configurable,
            enumerable: descriptor.enumerable,
            writable: descriptor.writable,
            name: propertyName,
            value: result,
            isOwn: obj.hasOwnProperty(propertyName)
        }
    }).filter((prop) => Boolean(prop))
}

/**
 * returns subtype of object
 */
export function getSubType (obj) {
    /**
     * null
     */
    if (obj === null) {
        return 'null'
    }

    /**
     * undefined
     */
    if (typeof obj === 'undefined') {
        return 'undefined'
    }

    /**
     * objects can have cases where constructor is null
     */
    if (!obj.constructor) {
        return 'map'
    }

    const constructorName = obj.constructor.name

    /**
     * error
     */
    if (obj instanceof Error || constructorName.match(/Error$/)) {
        return 'error'
    }

    /**
     * array
     */
    if (Array.isArray(obj) || (typeof obj.length === 'number' && obj.constructor.name !== 'object')) {
        return 'array'
    }

    /**
     * node
     */
    if (typeof obj.nodeType === 'number') {
        return 'node'
    }

    /**
     * iterator
     */
    if (obj.iterator) {
        return 'iterator'
    }

    /**
     * generator
     */
    if (constructorName === 'GeneratorFunction') {
        return 'generator'
    }

    /**
     * promise
     */
    if (obj instanceof Promise) {
        return 'promise'
    }

    /**
     * typedarray
     */
    if (constructorName.match(/^Float(\d+)Array$/)) {
        return 'typedarray'
    }

    /**
     * constructorName check
     */
    if (SUB_TYPES.indexOf(constructorName.toLowerCase()) > -1) {
        return constructorName.toLowerCase
    }
}

/**
 * generates an error object
 * @param  {String} [message='fake']  error message (optional)
 * @return {Object}                   error object
 */
export function getError (message = 'fake', fakeStack = false) {
    try {
        throw new Error(message)
    } catch (err) {
        /**
         * fake stack if none existing
         * TV browser doesn't allow to modify error object (readonly) so we need to
         * fake the error object
         */
        if (!err.stack || fakeStack) {
            return getFakeError(err)
        }

        return err
    }
}

/**
 * generates a fake error object since we can't modify the stack and eval errors come without
 */
export function getFakeError (err) {
    const newError = {
        message: err.message,
        stack: `${err.constructor.name}: ${err.message}\n\tat <anonymous>:1:1`
    }
    newError.constructor = err.constructor
    return newError
}

/**
 * returns stacktrace data for console.log event
 */
export function __getStacktrace (err) {
    let error = err || getError()

    if (!error) {
        return []
    }

    const splittedStack = error.stack.split('\n')
    return splittedStack.filter((line) => {
        /**
         * filter out own functions
         */
        return !line.match(/^__(getStacktrace|fakeConsole)/)
    }).map((line) => {
        const stackData = line.trim().match(/^(.*@)*(.*):(\d+):(\d+)$/)

        if (!stackData) {
            return null
        }

        /**
         * ToDo assign _nodeId to each element on the page to get this working
         */
        const url = stackData[2]
        const script = Array.from(document.querySelectorAll('script')).filter((script) => {
            return script.src === url
        })[0]

        return {
            columnNumber: stackData[4],
            lineNumber: stackData[3],
            scriptId: script ? script._nodeId : 0,
            url: stackData[2],
            functionName: stackData[1] ? stackData[1].slice(0, 1) : ''
        }
    }).filter((stackData) => Boolean(stackData))
}
