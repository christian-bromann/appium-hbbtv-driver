/**
 * Go
 * The Go command is used to cause the user agent to navigate the current top-level browsing
 * context a new location.
 *
 * @param  {String} sessionId sessionId
 * @param  {String} url       web element id
 * @see https://www.w3.org/TR/webdriver/#go
 */
export function go ({ sessionId, url }) {
    if (!url.match(/^http(s)*:\/\//)) {
        return this.error('go', 'InvalidArgumentError')
    }

    window.location.assign(url)
}

/**
 * The Get Current URL command returns the URL of the current top-level browsing context.
 *
 * @param  {String} sessionId sessionId
 * @return {String}           data url
 * @see https://www.w3.org/TR/webdriver/#get-current-url
 */
export function getCurrentURL ({ sessionId }) {
    return this.respond('getCurrentURL', document.URL)
}

/**
 * The Back command causes the browser to traverse one step backward in the joint session
 * history of the current top-level browsing context. This is equivalent to pressing the back
 * button in the browser chrome or calling window.history.back.
 *
 * @param  {String} sessionId sessionId
 * @see https://www.w3.org/TR/webdriver/#back
 */
export function back ({ sessionId }) {
    window.history.back()
}

/**
 * The Forward command causes the browser to traverse one step forwards in the joint session
 * history of the current top-level browsing context.
 *
 * @param  {String} sessionId sessionId
 * @see https://www.w3.org/TR/webdriver/#forward
 */
export function forward ({ sessionId }) {
    window.history.forward()
}

/**
 * The Refresh command causes the browser to reload the page in in current top-level
 * browsing context.
 *
 * @param  {String} sessionId sessionId
 * @see https://www.w3.org/TR/webdriver/#refresh
 */
export function refresh ({ sessionId }) {
    window.location.reload()
}

/**
 * The Get Title command returns the document title of the current top-level browsing context,
 * equivalent to calling `document.title`.
 *
 * @param  {String} sessionId sessionId
 * @see https://www.w3.org/TR/webdriver/#get-title
 */
export function getTitle ({ sessionId }) {
    return this.respond('getTitle', document.title)
}
