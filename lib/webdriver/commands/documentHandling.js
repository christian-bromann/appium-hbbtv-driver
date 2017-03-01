/**
 * Getting Page Source
 * The Get Page Source command returns a string serialization of the DOM of the current browsing
 * context active document.
 *
 * @param  {String} sessionId sessionId
 * @see https://www.w3.org/TR/webdriver/#getting-page-source
 */
export function getPageSource ({ sessionId }) {
    /**
     * Let source be the result of serializing to string the current browsing context active
     * document, if source is null.
     */
    this.respond('getSource', document.documentElement.outerHTML)
}

/**
 * Executing Script
 * The Execute Script command executes a JavaScript function in the context of the current
 * browsing context and returns the return value of the function.
 *
 * @param  {String} script    function to execute
 * @param  {Object} args      function arguments
 * @param  {String} sessionId sessionId
 */
export function execute ({script, args, sessionId}) {
    let value
    try {
        /**
         * Let result be the result of calling execute a function body, with arguments
         * body and arguments.
         */
        value = eval(`(function () { ${script} }).apply(window, [${args.join(', ')}])`) // eslint-disable-line no-eval
    } catch (error) {
        /**
         * If result is an error, return result.
         */
        return this.respond('execute', { error: error.message })
    }

    /**
     * Otherwise let value be result’s data.
     */
    this.respond('execute', value)
}

export function executeAsync ({script, args, sessionId}) {
    window._asyncCallback = (value) => {
        this.respond('executeAsync', value)
    }
    args.push(window._asyncCallback)

    try {
        eval(`(function () { ${script} }).apply(window, [${args.join(', ')}, window._asyncCallback])`)  // eslint-disable-line no-eval
    } catch (error) {
        return this.respond('executeAsync', { error: error.message })
    }
}
