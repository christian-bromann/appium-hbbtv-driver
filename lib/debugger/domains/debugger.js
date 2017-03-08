/**
 * Methods
 */

/**
 * Defines pause on exceptions state. Can be set to stop on all exceptions, uncaught exceptions
 * or no exceptions. Initial pause on exceptions state is `none`.
 *
 * @param  {String} state  Pause on exceptions mode. Allowed values: none, uncaught, all.
 */
export function setPauseOnExceptions () {
    return {}
}

/**
 * Enables or disables async call stacks tracking.
 *
 * @param  {Integer} maxDepth  Maximum depth of async call stacks. Setting to 0 will effectively
 *                             disable collecting async call stacks (default).
 */
export function setAsyncCallStackDepth () {
    return {}
}

/**
 * Replace previous blackbox patterns with passed ones. Forces backend to skip stepping/pausing
 * in scripts with url matching one of the patterns. VM will try to leave blackboxed script by
 * performing 'step in' several times, finally resorting to 'step out' if unsuccessful.
 *
 * @param  {String[]} patterns  Array of regexps that will be used to check script url for
 *                              blackbox state.
 */
export function setBlackboxPatterns () {
    return {}
}

/**
 * Events
 */

/**
 * Fired when virtual machine parses script. This event is also fired for all known and
 * uncollected scripts upon enabling debugger.
 */
export function scriptParsed () {
    const scripts = document.querySelectorAll('script')

    for (const script of scripts) {
        this.execute('Debugger.scriptParsed', {
            header: {
                startColumn: 0,
                startLine: 0,
                executionContextAuxData: {
                    frameId: this.requestId,
                    isDefault: true
                },
                hasSourceURL: Boolean(script.attributes && script.attributes.src && script.attributes.src.nodeValue),
                isLiveEdit: false,
                scriptId: script._nodeId,
                sourceMapURL: '',
                url: ''
            }
        })
    }
}
