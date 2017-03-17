const SUB_TYPES = [
    'array', 'null', 'node', 'regexp', 'date', 'map', 'set', 'iterator',
    'generator', 'error', 'proxy', 'promise', 'typedarray'
]

/**
 * parse console properties properly
 * @param  {*}             arg  any kind of primitive or object
 * @return {RemoteObject}       Mirror object referencing original JavaScript object.
 */
export function getConsoleArg (arg) {
    const type = typeof arg
    const properties = []
    const instanceName = arg.constructor.name
    const description = arg.stack ? arg.stack : instanceName

    /**
     * return primitives right away
     */
    if (type.match(/^(number|string|null|undefined|boolean)$/)) {
        return { type, value: arg }
    }

    for (const name of Object.getOwnPropertyNames(arg)) {
        properties.push({ name, type: typeof arg[name], value: arg[name] })
    }

    const result = {
        className: instanceName,
        description,
        objectId: '{"injectedScriptId": 1, "id": 1}', // ToDo replace with real objectId
        type
    }

    /**
     * apply subtype based on instance name
     */
    if (SUB_TYPES.indexOf(instanceName.toLowerCase()) > -1) {
        result.subtype = instanceName.toLowerCase()
    }

    /**
     * apply preview for objects only
     */
    if (type === 'object') {
        result.preview = {
            description,
            overflow: false,
            properties,
            type
        }
    }

    return result
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
