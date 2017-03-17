/**
 * parse console properties properly
 * @param  {*}             arg  any kind of primitive or object
 * @return {RemoteObject}       Mirror object referencing original JavaScript object.
 */
export function getConsoleArg (arg) {
    const type = typeof arg
    const properties = []
    const instanceName = arg.constructor.name

    /**
     * return primitives right away
     */
    if (type.match(/^(number|string|null|undefined|boolean)$/)) {
        return { type, value: arg }
    }

    for (const name of Object.getOwnPropertyNames(arg)) {
        properties.push({ name, type: typeof arg[name], value: name })
    }

    const result = {
        description: instanceName,
        objectId: '{"injectedScriptId": 1, "id": 1}', // ToDo replace with real objectId
        type
    }

    /**
     * apply preview for objects only
     */
    if (instanceName === 'object') {
        result.preview = {
            description: instanceName,
            overflow: false,
            properties,
            type
        }
    }

    return result
}

/**
 * returns stacktrace data for console.log event
 */
export function __getStacktrace () {
    let error = null

    try {
        throw new Error('fake')
    } catch (err) {
        error = err
    }

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
