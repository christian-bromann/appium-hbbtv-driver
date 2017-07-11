import os from 'os'
import fs from 'fs'
import path from 'path'
import stringify from 'json-stringify-safe'
import validator from 'validator'
import { cat } from 'shelljs'
import request from 'request-promise-native'
import zipObject from 'lodash.zipobject'

import logger from './logger'

import { MJSONWPError } from 'appium-base-driver/build/lib/mjsonwp/errors'

const OBJLENGTH = 10
const ARRLENGTH = 10
const STRINGLIMIT = 1000
const STRINGTRUNCATE = 200

const CONFIG_FILE_PATH = path.resolve(__dirname, '..', 'config.json')
const log = logger('Utils')

/**
 * Limit the length of an arbitrary variable of any type, suitable for being logged or displayed
 * @param  {Any} val Any variable
 * @return {Any}     Limited var of same type
 */
export function limit (val) {
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

export function getIpAddress (iface, family = 'ipv4') {
    const interfaces = os.networkInterfaces()

    /**
     * check if interface can be found
     */
    if (!interfaces[iface]) {
        return null
    }

    return interfaces[iface].filter((conn) => conn.family.toLowerCase() === family)[0].address
}

export function readConfig () {
    let config = { data: {} }

    try {
        config = JSON.parse(fs.readFileSync(CONFIG_FILE_PATH))
    } catch (e) {
    }

    return config
}

export function writeConfig (data) {
    const newConfig = { data }
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(newConfig), 'utf8')
}

export async function getDeviceInformation () {
    const tvDevice = readArp().filter((device) => device.device === 'eth1' && device.flags === '0x2')[0]

    if (!tvDevice) {
        throw new Error('Could not find smart TV')
    }

    const ip = tvDevice.ipAddress
    let result

    /**
     * try to receive device information from TV
     */
    try {
        /**
         * newer Samsung devices
         */
        result = await request.get(`http://${ip}:8001/api/v2/`, { json: true })
        result = {
            ip,
            deviceName: result.name,
            platformVersion: result.version,
            platformName: result.device.OS,
            resolution: result.device.resolution,
            model: result.device.model,
            modelName: result.device.modelName
        }
    } catch (e) {
        log.info('Could not receive device data from Samsung device, error: ' + e.message)
    }

    if (!result) {
        throw new Error('no suiteable device information found')
    }

    return result
}

export async function getDeviceConfig (body = {}) {
    const piIPAddress = getIpAddress('eth0') || getIpAddress('wlan0')
    let deviceData = {}

    try {
        deviceData = await getDeviceInformation()
    } catch (e) {
        log.error(`Couldn't detect device information (error: "${e.message}"), using defaults`)
        /**
         * create default deviceData
         */
        deviceData = { platformName: os.hostname() }
        /**
         * overwrite with custom data from form
         * @type {Array}
         */
        const capabilityName = body.capabilityName || []
        const capabilityValue = body.capabilityValue || []
        deviceData = Object.assign(deviceData, zipObject(capabilityName, capabilityValue))
    }

    const { deviceName, platformVersion, platformName, resolution, model, modelName } = deviceData
    return {
        capabilities: [{
            deviceName,
            platformVersion,
            platformName,
            resolution,
            model,
            modelName,
            maxInstances: 1
        }],
        configuration: {
            cleanUpCycle: 2000,
            timeout: 30000,
            proxy: 'org.openqa.grid.selenium.proxy.DefaultRemoteProxy',
            url: `http://${piIPAddress}:4723/wd/hub`,
            host: piIPAddress,
            port: 4723,
            maxSession: 1,
            register: true,
            registerCycle: 5000
        }
    }
}

export function readArp () {
    const data = cat('/proc/net/arp')

    /**
     * ignore first and last line via slice
     */
    return data.split('\n').slice(1, -1).map((line) => {
        const trimmedLine = line.split(' ').filter(text => Boolean(text))
        return {
            'ipAddress': trimmedLine[0],
            'hwType': trimmedLine[1],
            'flags': trimmedLine[2],
            'hwAddress': trimmedLine[3],
            'mask': trimmedLine[4],
            'device': trimmedLine[5]
        }
    })
}

/**
 * check if node is already registered
 */
export async function isAlreadyRegistered (host, port, uuid) {
    try {
        let response = await request({
            uri: `http://${host}:${port}/grid/api/proxy?id=${uuid}`,
            method: 'GET',
            timeout: 10000,
            json: true,
            resolveWithFullResponse: true // return the full response, not just the body
        })

        return response.body.success
    } catch (err) {
        log.error(`Hub down or not responding: ${err.message}`)
        return false
    }
}

export async function waitForEvent (emitter, eventName, timeout) {
    let listener, timeoutId
    await new Promise((resolve, reject) => {
        listener = (result) => {
            console.log('waiting on ', eventName, ' got ', result.method)
            clearTimeout(timeoutId)
            return resolve()
        }

        timeoutId = setTimeout(() => {
            emitter.removeListener(eventName, listener)
            reject(new Error(`${eventName} timeout`))
        }, timeout)

        emitter.once(eventName, listener)
    })
}

/**
 * selenium error codes
 * https://www.w3.org/TR/webdriver/#handling-errors
 */
export class ElementClickInterceptedError extends MJSONWPError {
    static status = 400
    static code = 'element click intercepted'
    static message = 'The Element Click command could not be completed because the element receiving the events is obscuring the element that was requested clicked.'
    constructor (err) {
        super(err || ElementClickInterceptedError.message, ElementClickInterceptedError.code)
    }
}

export class ElementNotSelectableError extends MJSONWPError {
    static status = 400
    static code = 'element not selectable'
    static message = 'An attempt was made to select an element that cannot be selected.'
    constructor (err) {
        super(err || ElementNotSelectableError.message, ElementNotSelectableError.code)
    }
}

export class ElementNotInteractableError extends MJSONWPError {
    static status = 400
    static code = 'element not interactable'
    static message = 'A command could not be completed because the element is not pointer- or keyboard interactable.'
    constructor (err) {
        super(err || ElementNotInteractableError.message, ElementNotInteractableError.code)
    }
}

export class InsecureCertificateError extends MJSONWPError {
    static status = 400
    static code = 'insecure certificate'
    static message = 'Navigation caused the user agent to hit a certificate warning, which is usually the result of an expired or invalid TLS certificate.'
    constructor (err) {
        super(err || InsecureCertificateError.message, InsecureCertificateError.code)
    }
}

export class InvalidArgumentError extends MJSONWPError {
    static status = 400
    static code = 'invalid argument'
    static message = 'The arguments passed to a command are either invalid or malformed.'
    constructor (err) {
        super(err || InvalidArgumentError.message, InvalidArgumentError.code)
    }
}

export class InvalidCookieDomainError extends MJSONWPError {
    static status = 400
    static code = 'invalid cookie domain'
    static message = 'An illegal attempt was made to set a cookie under a different domain than the current page.'
    constructor (err) {
        super(err || InvalidCookieDomainError.message, InvalidCookieDomainError.code)
    }
}

export class InvalidCoordinatesError extends MJSONWPError {
    static status = 400
    static code = 'invalid coordinates'
    static message = 'The coordinates provided to an interactions operation are invalid.'
    constructor (err) {
        super(err || InvalidCoordinatesError.message, InvalidCoordinatesError.code)
    }
}

export class InvalidElementStateError extends MJSONWPError {
    static status = 400
    static code = 'invalid element state'
    static message = 'A command could not be completed because the element is in an invalid state, e.g. attempting to click an element that is no longer attached to the document.'
    constructor (err) {
        super(err || InvalidElementStateError.message, InvalidElementStateError.code)
    }
}

export class InvalidSelectorError extends MJSONWPError {
    static status = 400
    static code = 'invalid selector'
    static message = 'Argument was an invalid selector.'
    constructor (err) {
        super(err || InvalidSelectorError.message, InvalidSelectorError.code)
    }
}

export class InvalidSessionIdError extends MJSONWPError {
    static status = 404
    static code = 'invalid session id'
    static message = 'Occurs if the given session id is not in the list of active sessions, meaning the session either does not exist or that it’s not active.'
    constructor (err) {
        super(err || InvalidSessionIdError.message, InvalidSessionIdError.code)
    }
}

export class JavascriptError extends MJSONWPError {
    static status = 500
    static code = 'javascript error'
    static message = 'An error occurred while executing JavaScript supplied by the user.'
    constructor (err) {
        super(err || JavascriptError.message, JavascriptError.code)
    }
}

export class MoveTargetOutOfBoundsError extends MJSONWPError {
    static status = 500
    static code = 'move target out of bounds'
    static message = 'The target for mouse interaction is not in the browser’s viewport and cannot be brought into that viewport.'
    constructor (err) {
        super(err || MoveTargetOutOfBoundsError.message, MoveTargetOutOfBoundsError.code)
    }
}

export class NoSuchAlertError extends MJSONWPError {
    static status = 400
    static code = 'no such alert'
    static message = 'An attempt was made to operate on a modal dialog when one was not open.'
    constructor (err) {
        super(err || NoSuchAlertError.message, NoSuchAlertError.code)
    }
}

export class NoSuchCookieError extends MJSONWPError {
    static status = 404
    static code = 'no such cookie'
    static message = 'No cookie matching the given path name was found amongst the associated cookies of the current browsing context’s active document.'
    constructor (err) {
        super(err || NoSuchCookieError.message, NoSuchCookieError.code)
    }
}

export class NoSuchElementError extends MJSONWPError {
    static status = 404
    static code = 'no such element'
    static message = 'An element could not be located on the page using the given search parameters.'
    constructor (err) {
        super(err || NoSuchElementError.message, NoSuchElementError.code)
    }
}

export class NoSuchFrameError extends MJSONWPError {
    static status = 400
    static code = 'no such frame'
    static message = 'A command to switch to a frame could not be satisfied because the frame could not be found.'
    constructor (err) {
        super(err || NoSuchFrameError.message, NoSuchFrameError.code)
    }
}

export class NoSuchWindowError extends MJSONWPError {
    static status = 400
    static code = 'no such window'
    static message = 'A command to switch to a window could not be satisfied because the window could not be found.'
    constructor (err) {
        super(err || NoSuchWindowError.message, NoSuchWindowError.code)
    }
}

export class ScriptTimeoutError extends MJSONWPError {
    static status = 408
    static code = 'script timeout'
    static message = 'A script did not complete before its timeout expired.'
    constructor (err) {
        super(err || ScriptTimeoutError.message, ScriptTimeoutError.code)
    }
}

export class SessionNotCreatedError extends MJSONWPError {
    static status = 500
    static code = 'session not created'
    static message = 'A new session could not be created.'
    constructor (err) {
        super(err || SessionNotCreatedError.message, SessionNotCreatedError.code)
    }
}

export class StaleElementReferenceError extends MJSONWPError {
    static status = 400
    static code = 'stale element reference'
    static message = 'A command failed because the referenced element is no longer attached to the DOM.'
    constructor (err) {
        super(err || StaleElementReferenceError.message, StaleElementReferenceError.code)
    }
}

export class TimeoutError extends MJSONWPError {
    static status = 408
    static code = 'timeout'
    static message = 'An operation did not complete before its timeout expired.'
    constructor (err) {
        super(err || TimeoutError.message, TimeoutError.code)
    }
}

export class UnableToSetCookieError extends MJSONWPError {
    static status = 500
    static code = 'unable to set cookie'
    static message = 'A command to set a cookie’s value could not be satisfied.'
    constructor (err) {
        super(err || UnableToSetCookieError.message, UnableToSetCookieError.code)
    }
}

export class UnableToCaptureScreenError extends MJSONWPError {
    static status = 500
    static code = 'unable to capture screen'
    static message = 'A screen capture was made impossible.'
    constructor (err) {
        super(err || UnableToCaptureScreenError.message, UnableToCaptureScreenError.code)
    }
}

export class UnexpectedAlertOpenError extends MJSONWPError {
    static status = 500
    static code = 'unexpected alert open'
    static message = 'A modal dialog was open, blocking this operation.'
    constructor (err) {
        super(err || UnexpectedAlertOpenError.message, UnexpectedAlertOpenError.code)
    }
}

export class UnknownCommandError extends MJSONWPError {
    static status = 404
    static code = 'unknown command'
    static message = 'A command could not be executed because the remote end is not aware of it.'
    constructor (err) {
        super(err || UnknownCommandError.message, UnknownCommandError.code)
    }
}

export class UnknownError extends MJSONWPError {
    static status = 500
    static code = 'unknown error'
    static message = 'An unknown error occurred in the remote end while processing the command.'
    constructor (err) {
        super(err || UnknownError.message, UnknownError.code)
    }
}

export class UnknownMethodError extends MJSONWPError {
    static status = 405
    static code = 'unknown method'
    static message = 'The requested command matched a known URL but did not match an method for that URL.'
    constructor (err) {
        super(err || UnknownMethodError.message, UnknownMethodError.code)
    }
}

export class UnsupportedOperationError extends MJSONWPError {
    static status = 500
    static code = 'unsupported operation'
    static message = 'Indicates that a command that should have executed properly cannot be supported for some reason.'
    constructor (err) {
        super(err || UnsupportedOperationError.message, UnsupportedOperationError.code)
    }
}

export const errors = {
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
