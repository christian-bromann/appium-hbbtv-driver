/**
 * Methods
 */

/**
 * Tells inspected instance to run if it was waiting for debugger to attach.
 */
export function runIfWaitingForDebugger () {
    return {}
}

/**
 * overwrite console
 */
export function overwriteConsole (console) {
    return Object.keys(Object.getPrototypeOf(console)).reduce((con, type) => {
        if (typeof console[type] !== 'function') {
            con[type] = console[type]
            return con
        }

        var origFn = console[type].bind(console)
        con[type] = (...args) => {
            this.execute('Runtime.consoleAPICalled', {
                args: args.map(getConsoleArg),
                executionContext: 1,
                stackTrace: { callFrames: getStacktrace() },
                timestamp: (new Date()).getTime(),
                type
            })
            origFn.apply(this, args)
        }
        return con
    }, {})
}

/**
 * parse console properties properly
 * @param  {*}             arg  any kind of primitive or object
 * @return {RemoteObject}       Mirror object referencing original JavaScript object.
 */
function getConsoleArg (arg) {
    const type = typeof arg
    const properties = []
    const instanceName = Object.getPrototypeOf(arg).constructor.name

    /**
     * return primitives right away
     */
    if (type.match(/^(number|string|null|undefined|boolean)$/)) {
        return { type, value: arg }
    }

    for (const name of Object.getOwnPropertyNames(arg)) {
        properties.push({ name, type: typeof arg[name], value: name })
    }

    return {
        description: instanceName,
        objectId: '{"injectedScriptId": 1, "id": 1}', // ToDo replace with real objectId
        preview: {
            description: instanceName,
            overflow: false,
            properties,
            type
        },
        type
    }
}

/**
 * returns stacktrace data for console.log event
 */
function getStacktrace () {
    let error = null

    try {
        throw new Error('fake')
    } catch (err) {
        error = err
    }

    if (!error) {
        return []
    }

    return error.stack.split('\n').slice(2).map((line) => {
        const stackData = line.trim().match(/^(.*)@(.*):(\d+):(\d+)$/)

        if (!stackData) {
            return null
        }

        /**
         * ToDo assign _nodeId to each element on the page to get this working
         */
        // const url = stackData[2]
        // const script = Array.from(document.querySelectorAll('script')).filter((script) => {
        //     return script.src === url
        // })[0]

        return {
            columnNumber: stackData[4],
            lineNumber: stackData[3],
            scriptId: 1,
            url: stackData[2],
            functionName: stackData[1]
        }
    }).filter((stackData) => Boolean(stackData))
}

/**
 * Events
 */

/**
 * Issued when new execution context is created (e.g. when page load event gets triggered).
 *
 * @return {ExecutionContextDescription} A newly created execution contex.
 */
export function executionContextCreated () {
    this.execute('Runtime.executionContextCreated', {
        context: {
            auxData: {
                frameId: this.frameId,
                isDefault: true
            },
            id: 1,
            name: document.title,
            origin: window.location.origin
        }
    })
}
