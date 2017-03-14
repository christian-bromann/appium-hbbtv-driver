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
