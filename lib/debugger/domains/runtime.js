import { getConsoleArg, getStacktrace } from '../utils/runtime'

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
