import { getConsoleArg, __getStacktrace, getFakeError } from '../utils/runtime'

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

        const origFn = console[type].bind(console)
        const self = this
        con[type] = function __fakeConsole (...args) {
            self.execute('Runtime.consoleAPICalled', {
                args: args.map(getConsoleArg),
                executionContext: self.executionContextId,
                stackTrace: { callFrames: __getStacktrace() },
                timestamp: (new Date()).getTime(),
                type
            })
            origFn.apply(self, args)
        }
        return con
    }, {})
}

/**
 * Evaluates expression on global object.
 *
 * @param  {Boolean}            awaitPromise          Whether execution should wait for promise to be
 *                                                    resolved. If the result of evaluation is not a
 *                                                    Promise, it's considered to be an error.
 * @param  {ExecutionContextId} contextId             Specifies in which execution context to perform
 *                                                    evaluation. If the parameter is omitted the
 *                                                    evaluation will be performed in the context of
 *                                                    the inspected page.
 * @param  {String}             expression            Expression to evaluate.
 * @param  {Boolean}            generatePreview       Whether preview should be generated for the result.
 * @param  {Boolean}            includeCommandLineAPI Determines whether Command Line API should be
 *                                                    available during the evaluation.
 * @param  {String}             objectGroup           Symbolic group name that can be used to release
 *                                                    multiple objects.
 * @param  {Boolean}            returnByValue         Whether the result is expected to be a JSON object
 *                                                    that should be sent by value.
 * @param  {Boolean}            silent                In silent mode exceptions thrown during evaluation
 *                                                    are not reported and do not pause execution.
 *                                                    Overrides setPauseOnException state.
 * @param  {Boolean}            userGesture           Whether execution should be treated as initiated
 *                                                    by user in the UI.
 * @return {RemoteObject|ExceptionDetails}                       Evauluation result or exception details
 */
export function evaluate ({
    awaitPromise, contextId, expression, generatePreview, includeCommandLineAPI,
    objectGroup, returnByValue, silent, userGesture
}) {
    /**
     * evaluate is only supported for console executions
     */
    if (objectGroup !== 'console') {
        return {}
    }

    const geval = window.eval // eslint-disable-line no-eval
    let result = null
    try {
        result = geval(expression)

        /**
         * in case evaluate throws an error or returns one we need to fake the stack
         * in order to not send debugger stacktraces
         */
        if (result instanceof Error) {
            result = getFakeError(result)
        }

        result = { result: getConsoleArg(result) }
    } catch (err) {
        const newError = getFakeError(err)
        const errorResult = getConsoleArg(newError)

        result = {
            result: getConsoleArg(newError),
            exceptionDetails: {
                columnNumber: 0,
                lineNumber: 0,
                scriptId: 0,
                exception: errorResult,
                exceptionId: 1, // ToDo monitor exceptions
                stackTrace: { callFrames: __getStacktrace(newError) },
                text: newError.constructor.name
            }
        }
    }
    return result
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
            id: this.executionContextId,
            name: document.title,
            origin: window.location.origin
        }
    })
}
