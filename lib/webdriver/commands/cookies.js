import Cookies from 'js-cookie'

/**
 * polyfill for endsWith
 * from: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/endsWith
 */
if (!String.prototype.endsWith) {
    String.prototype.endsWith = function (searchString, position) { // eslint-disable-line no-extend-native
        var subjectString = this.toString()
        if (typeof position !== 'number' || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
            position = subjectString.length
        }
        position -= searchString.length
        var lastIndex = subjectString.lastIndexOf(searchString, position)
        return lastIndex !== -1 && lastIndex === position
    }
}

/**
 * Get All Cookies
 * The Get All Cookies command returns all cookies associated with the address of the current
 * browsing context’s active document.
 *
 * @param  {String} sessionId sessionId
 * @see https://w3c.github.io/webdriver/webdriver-spec.html#get-all-cookies
 */
export function getAllCookies ({ sessionId }) {
    const cookies = Cookies.get()
    return this.respond('getAllCookies', Object.keys(cookies).map((name) => {
        return { name, value: cookies[name] }
    }))
}

/**
 * Get Named Cookies
 * The Get Named Cookie command returns the cookie with the requested name from the associated
 * cookies in the cookie store of the current browsing context’s active document.
 *
 * @param  {String} sessionId sessionId
 * @param  {String} name      name of the cookie to receive
 * @see https://w3c.github.io/webdriver/webdriver-spec.html#get-named-cookie
 */
export function getNamedCookies ({ sessionId, name }) {
    const cookie = Cookies.get(name)

    /**
     * If no cookie is found, a no such cookie error is returned.
     */
    if (!cookie) {
        return this.error('getNamedCookies', 'NoSuchCookieError')
    }

    return this.respond('getNamedCookies', cookie)
}

/**
 * The Add Cookie command adds a single cookie to the cookie store associated with
 * the active document’s address.
 *
 * @param  {String} sessionId sessionId
 * @param  {Object} cookie    cookie object (https://w3c.github.io/webdriver/webdriver-spec.html#cookies)
 * @see https://w3c.github.io/webdriver/webdriver-spec.html#add-cookie
 */
export function addCookie ({ sessionId, cookie }) {
    const pageDomain = document.location.host.split(/\./).slice(-2).join('.')

    /**
     * validate required fields
     */
    if (typeof cookie.name !== 'string' || typeof cookie.value !== 'string') {
        return this.error('addCookie', 'InvalidArgumentError')
    }

    /**
     * validate optional fields
     */
    if (typeof cookie.domain === 'string' && !cookie.domain.endsWith(pageDomain)) {
        return this.error('addCookie', 'InvalidArgumentError')
    }

    if (
        (cookie.expiry && typeof cookie.expiry !== 'number') ||
        (typeof cookie.expiry === 'number' && cookie.expiry > Math.pow(2, 64) - 1)
    ) {
        return this.error('addCookie', 'InvalidArgumentError')
    }

    /**
     * make sure secure and httpOnly are boolean
     */
    cookie.secure = Boolean(cookie.secure)
    cookie.httpOnly = Boolean(cookie.httpOnly)

    /**
     * set cookie
     */
    const { domain, path, expiry, secure, httpOnly } = cookie
    Cookies.set(cookie.name, cookie.value, { domain, path, expiry, secure, httpOnly })
    return this.respond('addCookie')
}

/**
 * The Delete All Cookies command allows deletion of all cookies associated with
 * the active document’s address.
 *
 * @param  {String} sessionId sessionId
 * @see https://w3c.github.io/webdriver/webdriver-spec.html#delete-all-cookies
 */
export function deleteAllCookies ({ sessionId }) {
    const cookies = Cookies.get()
    for (const cookie of Object.keys(cookies)) {
        Cookies.remove(cookie)
    }
}

/**
 * The Delete Cookie command allows you to delete either a single cookie by parameter
 * name, or all the cookies associated with the active document’s address if name is
 * undefined.
 *
 * @param  {String} sessionId sessionId
 * @param  {Object} cookie    cookie parameter (you can only delete a cookie that was set with
 *                            path or domain if you specify these params)
 */
export function deleteCookie ({ sessionId, name }) {
    /**
     * validate required fields
     */
    if (typeof name !== 'string') {
        return this.error('addCookie', 'InvalidArgumentError')
    }

    Cookies.remove(name)
    return this.respond('deleteCookie')
}
