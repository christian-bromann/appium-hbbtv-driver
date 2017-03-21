import { scriptParsed } from './debugger'
import { getConsoleArg, __getStacktrace, getFakeError, getObjectProperties } from '../utils/runtime'

export const scripts = []

/**
 * internal methods
 */

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
 * Methods
 */

/**
 * Tells inspected instance to run if it was waiting for debugger to attach.
 */
export function runIfWaitingForDebugger () {
    return {} // NYI
}

/**
 * Compiles expression.
 * @param  {String}           expression Expression to compile.
 * @param  {*}                context    scope to call expression on
 * @return {ScriptId}                    Id of the script.
 * @return {ExceptionDetails}            Exception details
 */
export function compileScript ({ expression }, context = window) {
    const script = {
        expression,
        scriptId: (scripts.length + 1).toString()
    }

    function callFn (expression) {
        // log('execute with ---->', Object.getPrototypeOf(this).constructor.name, 'but it is', this.constructor.name)
        return window.eval(expression) // eslint-disable-line no-eval
    }

    let result = null
    try {
        result = callFn.call(context, expression)
        script.result = result
        scripts.push(script)
        scriptParsed.call(this, script)

        return { scriptId: script.scriptId }
    } catch (err) {
        script.error = err
        scripts.push(script)

        /**
         * trigger scriptFailedToParse event when last 3 scripts failed
         */
        // scriptFailedToParse.call(this, script)

        return {
            exceptionDetails: {
                columnNumber: 0,
                exception: getConsoleArg(err, script.scriptId),
                exceptionId: scripts.filter((_script) => Boolean(_script.error)).length,
                lineNumber: 0,
                scriptId: script.scriptId,
                text: 'Uncaught'
            }
        }
    }
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
    if (['console', 'completion'].indexOf(objectGroup) === -1) {
        return {}
    }

    if (objectGroup === 'completion') {
        compileScript.call(this, { expression })
    }

    let { error, result, scriptId } = scripts[scripts.length - 1]

    if (error) {
        const newError = getFakeError(error)
        const errorResult = getConsoleArg(newError, scriptId)

        return {
            result: getConsoleArg(newError),
            exceptionDetails: {
                columnNumber: 0,
                lineNumber: 0,
                scriptId: scriptId,
                exception: errorResult,
                exceptionId: scripts.filter((_script) => Boolean(_script.error)).length,
                stackTrace: { callFrames: __getStacktrace(newError) },
                text: newError.constructor.name
            }
        }
    }

    if (objectGroup === 'completion' && !returnByValue) {
        const constructorName = result && result.constructor ? result.constructor.name : undefined
        return {
            result: {
                className: constructorName,
                description: constructorName,
                objectId: JSON.stringify({ injectedScriptId: 1, id: scriptId }),
                type: typeof result
            }
        }
    }

    /**
     * in case evaluate throws an error or returns one we need to fake the stack
     * in order to not send debugger stacktraces
     */
    if (result instanceof Error) {
        result = getFakeError(result)
    }

    return { result: getConsoleArg(result, scriptId) }
}

/**
 * Calls function with given declaration on the given object. Object group of the result
 * is inherited from the target object.
 *
 * @param  {CallArgument[]}  arguments            Call arguments. All call arguments must belong
 *                                                to the same JavaScript world as the target object.
 * @param  {String}          functionDeclaration  Declaration of the function to call.
 * @return {RemoteObject}                         evelalutaion result
 * @return {ExceptionDetails}                     exception details
 */
export function callFunctionOn ({ arguments: args, functionDeclaration, objectId }) {
    const objectIdObject = JSON.parse(objectId)
    const objectIdResult = scripts.filter((script) => script.scriptId === objectIdObject.id)[0]

    window._callFunctionOnArgs = args
    compileScript.call(this, {
        expression: `(${functionDeclaration}).apply(this, window._callFunctionOnArgs)`
    }, objectIdResult.result)
    delete window._callFunctionOnArgs

    const script = scripts[scripts.length - 1]
    if (script.error) {
        log('EHHHHH', script.error)
        return { exceptionDetails: script.exceptionDetails }
    }

    return { result: {
        type: typeof script.result,
        value: script.result
    } }
}

/**
 * Releases all remote objects that belong to a given group.
 *
 * @param  {String} objectGroup  Symbolic object group name.
 */
export function releaseObjectGroup ({ objectGroup }) {
    return {}
}

/**
 * Returns properties of a given object. Object group of the result is inherited from the
 * target object.
 *
 * @param  {RemoteObjectId} objectId                Identifier of the object to return properties for.
 * @param  {Boolean}        ownProperties           If true, returns properties belonging only to the
 *                                                 element itself, not to its prototype chain.
 * @param  {Boolean}        accessorPropertiesOnly  If true, returns accessor properties (with
 *                                                 getter/setter) only; internal properties are not
 *                                                 returned either.
 * @param  {Boolean}        generatePreview        Whether preview should be generated for the results.
 *
 * @return {RemoteObject}      evelalutaion result
 * @return {ExceptionDetails}  exception details
 */
export function getProperties ({ accessorPropertiesOnly, objectId }) {
    /**
     * not able to detect accessors via JS yet
     */
    if (accessorPropertiesOnly) {
        return { result: [] }
    }

    const parsedObjectId = JSON.parse(objectId)
    const script = scripts.filter((_script) => parseInt(_script.scriptId, 10) === parsedObjectId.id)[0]

    if (!script) {
        return { result: [] }
    }

    return { result: getObjectProperties(script.result, true) }
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
