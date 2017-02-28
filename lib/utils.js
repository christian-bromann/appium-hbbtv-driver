import stringify from 'json-stringify-safe'
import validator from 'validator'

import { MJSONWPError } from 'appium-base-driver/build/lib/mjsonwp/errors'

const OBJLENGTH = 10
const ARRLENGTH = 10
const STRINGLIMIT = 1000
const STRINGTRUNCATE = 200

/**
 * Limit the length of an arbitrary variable of any type, suitable for being logged or displayed
 * @param  {Any} val Any variable
 * @return {Any}     Limited var of same type
 */
function limit (val) {
    if (!val) return val

    // Ensure we're working with a copy
    val = JSON.parse(stringify(val))

    switch (Object.prototype.toString.call(val)) {
    case '[object String]':
        if (val.length > 100 && validator.isBase64(val)) {
            return '[base64] ' + val.length + ' bytes'
        }

        if (val.length > STRINGLIMIT) {
            return val.substr(0, STRINGTRUNCATE) + ' ... (' + (val.length - STRINGTRUNCATE) + ' more bytes)'
        }

        return val
    case '[object Array]':
        const length = val.length
        if (length > ARRLENGTH) {
            val = val.slice(0, ARRLENGTH)
            val.push('(' + (length - ARRLENGTH) + ' more items)')
        }
        return val.map(limit)
    case '[object Object]':
        const keys = Object.keys(val)
        const removed = []
        for (let i = 0, l = keys.length; i < l; i++) {
            if (i < OBJLENGTH) {
                val[keys[i]] = limit(val[keys[i]])
            } else {
                delete val[keys[i]]
                removed.push(keys[i])
            }
        }
        if (removed.length) {
            val._ = (keys.length - OBJLENGTH) + ' more keys: ' + JSON.stringify(removed)
        }
        return val
    }
    return val
}

function getDomain (host) {
    if (!host) {
        return host
    }

    return host.split('.').slice(-2).join('.')
}

/**
 * selenium error codes
 * https://www.w3.org/TR/webdriver/#handling-errors
 */
class ElementClickInterceptedError extends MJSONWPError {
    static status = 400
    static code = 'element click intercepted'
    static message = 'The Element Click command could not be completed because the element receiving the events is obscuring the element that was requested clicked.'
    constructor (err) {
        super(err || ElementClickInterceptedError.message, ElementClickInterceptedError.code)
    }
}

class ElementNotSelectableError extends MJSONWPError {
    static status = 400
    static code = 'element not selectable'
    static message = 'An attempt was made to select an element that cannot be selected.'
    constructor (err) {
        super(err || ElementNotSelectableError.message, ElementNotSelectableError.code)
    }
}

class ElementNotInteractableError extends MJSONWPError {
    static status = 400
    static code = 'element not interactable'
    static message = 'A command could not be completed because the element is not pointer- or keyboard interactable.'
    constructor (err) {
        super(err || ElementNotInteractableError.message, ElementNotInteractableError.code)
    }
}

class InsecureCertificateError extends MJSONWPError {
    static status = 400
    static code = 'insecure certificate'
    static message = 'Navigation caused the user agent to hit a certificate warning, which is usually the result of an expired or invalid TLS certificate.'
    constructor (err) {
        super(err || InsecureCertificateError.message, InsecureCertificateError.code)
    }
}

class InvalidArgumentError extends MJSONWPError {
    static status = 400
    static code = 'invalid argument'
    static message = 'The arguments passed to a command are either invalid or malformed.'
    constructor (err) {
        super(err || InvalidArgumentError.message, InvalidArgumentError.code)
    }
}

class InvalidCookieDomainError extends MJSONWPError {
    static status = 400
    static code = 'invalid cookie domain'
    static message = 'An illegal attempt was made to set a cookie under a different domain than the current page.'
    constructor (err) {
        super(err || InvalidCookieDomainError.message, InvalidCookieDomainError.code)
    }
}

class InvalidCoordinatesError extends MJSONWPError {
    static status = 400
    static code = 'invalid coordinates'
    static message = 'The coordinates provided to an interactions operation are invalid.'
    constructor (err) {
        super(err || InvalidCoordinatesError.message, InvalidCoordinatesError.code)
    }
}

class InvalidElementStateError extends MJSONWPError {
    static status = 400
    static code = 'invalid element state'
    static message = 'A command could not be completed because the element is in an invalid state, e.g. attempting to click an element that is no longer attached to the document.'
    constructor (err) {
        super(err || InvalidElementStateError.message, InvalidElementStateError.code)
    }
}

class InvalidSelectorError extends MJSONWPError {
    static status = 400
    static code = 'invalid selector'
    static message = 'Argument was an invalid selector.'
    constructor (err) {
        super(err || InvalidSelectorError.message, InvalidSelectorError.code)
    }
}

class InvalidSessionIdError extends MJSONWPError {
    static status = 404
    static code = 'invalid session id'
    static message = 'Occurs if the given session id is not in the list of active sessions, meaning the session either does not exist or that it’s not active.'
    constructor (err) {
        super(err || InvalidSessionIdError.message, InvalidSessionIdError.code)
    }
}

class JavascriptError extends MJSONWPError {
    static status = 500
    static code = 'javascript error'
    static message = 'An error occurred while executing JavaScript supplied by the user.'
    constructor (err) {
        super(err || JavascriptError.message, JavascriptError.code)
    }
}

class MoveTargetOutOfBoundsError extends MJSONWPError {
    static status = 500
    static code = 'move target out of bounds'
    static message = 'The target for mouse interaction is not in the browser’s viewport and cannot be brought into that viewport.'
    constructor (err) {
        super(err || MoveTargetOutOfBoundsError.message, MoveTargetOutOfBoundsError.code)
    }
}

class NoSuchAlertError extends MJSONWPError {
    static status = 400
    static code = 'no such alert'
    static message = 'An attempt was made to operate on a modal dialog when one was not open.'
    constructor (err) {
        super(err || NoSuchAlertError.message, NoSuchAlertError.code)
    }
}

class NoSuchCookieError extends MJSONWPError {
    static status = 404
    static code = 'no such cookie'
    static message = 'No cookie matching the given path name was found amongst the associated cookies of the current browsing context’s active document.'
    constructor (err) {
        super(err || NoSuchCookieError.message, NoSuchCookieError.code)
    }
}

class NoSuchElementError extends MJSONWPError {
    static status = 404
    static code = 'no such element'
    static message = 'An element could not be located on the page using the given search parameters.'
    constructor (err) {
        super(err || NoSuchElementError.message, NoSuchElementError.code)
    }
}

class NoSuchFrameError extends MJSONWPError {
    static status = 400
    static code = 'no such frame'
    static message = 'A command to switch to a frame could not be satisfied because the frame could not be found.'
    constructor (err) {
        super(err || NoSuchFrameError.message, NoSuchFrameError.code)
    }
}

class NoSuchWindowError extends MJSONWPError {
    static status = 400
    static code = 'no such window'
    static message = 'A command to switch to a window could not be satisfied because the window could not be found.'
    constructor (err) {
        super(err || NoSuchWindowError.message, NoSuchWindowError.code)
    }
}

class ScriptTimeoutError extends MJSONWPError {
    static status = 408
    static code = 'script timeout'
    static message = 'A script did not complete before its timeout expired.'
    constructor (err) {
        super(err || ScriptTimeoutError.message, ScriptTimeoutError.code)
    }
}

class SessionNotCreatedError extends MJSONWPError {
    static status = 500
    static code = 'session not created'
    static message = 'A new session could not be created.'
    constructor (err) {
        super(err || SessionNotCreatedError.message, SessionNotCreatedError.code)
    }
}

class StaleElementReferenceError extends MJSONWPError {
    static status = 400
    static code = 'stale element reference'
    static message = 'A command failed because the referenced element is no longer attached to the DOM.'
    constructor (err) {
        super(err || StaleElementReferenceError.message, StaleElementReferenceError.code)
    }
}

class TimeoutError extends MJSONWPError {
    static status = 408
    static code = 'timeout'
    static message = 'An operation did not complete before its timeout expired.'
    constructor (err) {
        super(err || TimeoutError.message, TimeoutError.code)
    }
}

class UnableToSetCookieError extends MJSONWPError {
    static status = 500
    static code = 'unable to set cookie'
    static message = 'A command to set a cookie’s value could not be satisfied.'
    constructor (err) {
        super(err || UnableToSetCookieError.message, UnableToSetCookieError.code)
    }
}

class UnableToCaptureScreenError extends MJSONWPError {
    static status = 500
    static code = 'unable to capture screen'
    static message = 'A screen capture was made impossible.'
    constructor (err) {
        super(err || UnableToCaptureScreenError.message, UnableToCaptureScreenError.code)
    }
}

class UnexpectedAlertOpenError extends MJSONWPError {
    static status = 500
    static code = 'unexpected alert open'
    static message = 'A modal dialog was open, blocking this operation.'
    constructor (err) {
        super(err || UnexpectedAlertOpenError.message, UnexpectedAlertOpenError.code)
    }
}

class UnknownCommandError extends MJSONWPError {
    static status = 404
    static code = 'unknown command'
    static message = 'A command could not be executed because the remote end is not aware of it.'
    constructor (err) {
        super(err || UnknownCommandError.message, UnknownCommandError.code)
    }
}

class UnknownError extends MJSONWPError {
    static status = 500
    static code = 'unknown error'
    static message = 'An unknown error occurred in the remote end while processing the command.'
    constructor (err) {
        super(err || UnknownError.message, UnknownError.code)
    }
}

class UnknownMethodError extends MJSONWPError {
    static status = 405
    static code = 'unknown method'
    static message = 'The requested command matched a known URL but did not match an method for that URL.'
    constructor (err) {
        super(err || UnknownMethodError.message, UnknownMethodError.code)
    }
}

class UnsupportedOperationError extends MJSONWPError {
    static status = 500
    static code = 'unsupported operation'
    static message = 'Indicates that a command that should have executed properly cannot be supported for some reason.'
    constructor (err) {
        super(err || UnsupportedOperationError.message, UnsupportedOperationError.code)
    }
}

const errors = {
    ElementClickInterceptedError,
    ElementNotSelectableError,
    ElementNotInteractableError,
    InsecureCertificateError,
    InvalidArgumentError,
    InvalidCookieDomainError,
    InvalidCoordinatesError,
    InvalidElementStateError,
    InvalidSelectorError,
    InvalidSessionIdError,
    JavascriptError,
    MoveTargetOutOfBoundsError,
    NoSuchAlertError,
    NoSuchCookieError,
    NoSuchElementError,
    NoSuchFrameError,
    NoSuchWindowError,
    ScriptTimeoutError,
    SessionNotCreatedError,
    StaleElementReferenceError,
    TimeoutError,
    UnableToSetCookieError,
    UnableToCaptureScreenError,
    UnexpectedAlertOpenError,
    UnknownCommandError,
    UnknownError,
    UnknownMethodError,
    UnsupportedOperationError
}

export { limit, errors, getDomain }
