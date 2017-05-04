import path from 'path'
import { EventEmitter } from 'events'

import WebSocket from 'ws'
import { BaseDriver } from 'appium-base-driver'
import toPairs from 'lodash.topairs'

import OperaTVEmulator from './emulator'
import logger from './logger'
import commands from './commands'
import { limit, errors } from './utils'
import { desiredCapConstraints, desiredCapValidation } from './desired-caps'

const DRIVER_TIMEOUT = 10000
const SCRIPT_TIMEOUT = 30000
const IMPLICIT_WAIT_TIMEOUT = 30000
const PAGE_LOAD_TIMEOUT = 30000
const COMMAND_TIMEOUT = Math.max(SCRIPT_TIMEOUT, IMPLICIT_WAIT_TIMEOUT, PAGE_LOAD_TIMEOUT)

const SUPPORTED_LOCATOR_STRATEGIES = [
    'xpath',
    'link text',
    'css selector',
    'partial link text'
]

class HbbTVDriver extends BaseDriver {
    constructor (opts, shouldValidateCaps) {
        super(opts, shouldValidateCaps)

        this.desiredCapConstraints = desiredCapConstraints
        this.locatorStrategies = SUPPORTED_LOCATOR_STRATEGIES
        this.log = logger(path.basename(__filename))
        this.emitter = new EventEmitter()
        this.commandId = 0
        this.reset()
    }

    /**
     * resets session
     */
    async reset () {
    }

    async resetEmulator () {
        await new Promise((resolve) => setTimeout(resolve, 1000)) // time to unlock vm
        await this.emulator.clearProfile()
    }

    /**
     * check with the base class, and return if it fails
     */
    validateDesiredCaps (caps) {
        super.validateDesiredCaps(caps)
        return desiredCapValidation(caps)
    }

    /**
     * start emulator or TV session
     */
    async start (caps) {
        /**
         * run Opera TV emulator via VirtualBox
         */
        if (this.isEmulator()) {
            this.log.debug('Run Opera TV emulator session')
            return await this.startEmulator()
        }

        const sessionId = 'testpage'
        if (!caps.debuggerAddress) {
            // create page
        }

        const remoteDebuggingPageUrl = `ws://${caps.debuggerAddress}/devtools/page/${sessionId}`
        this.ws = new WebSocket(remoteDebuggingPageUrl, {
            perMessageDeflate: false
        })

        this.log.info('Trying to connect to remote debugging session')
        await new Promise((resolve, reject) => {
            this.ws.on('open', resolve)
            setTimeout(() => reject(new Error(
                `Couldn't connect to remote debugging page ${remoteDebuggingPageUrl}`)
            ), DRIVER_TIMEOUT)
        })

        this.ws.on('message', (msg) => {
            const response = JSON.parse(msg)

            if (response.id) {
                this.log.debug('Received socket response', response.id, response.method)
                this.emitter.emit(response.id, response.result)
            }

            this.emitter.emit('stream', response)
        })

        /**
         * ToDo implement for real TV
         */
        return true
    }

    /**
     * start session
     */
    async createSession (caps) {
        let [ sessionId ] = await super.createSession(caps)
        this.sessionId = sessionId

        this.log.debug(`Start session ${this.sessionId}`)
        await this.start(caps)

        return [this.sessionId, this.caps]
    }

    async deleteSession () {
        this.log.debug('Deleting HbbTV session')

        if (this.isEmulator()) {
            await this.emulator.powerOff()
            await this.resetEmulator()
        }

        await super.deleteSession()
        this.log.debug('Bye 👋 !')
    }

    /**
     * make request to frontend driver
     * @param  {String} cmd       command name
     * @param  {Object} [args={}] arguments for command
     * @return {Object}           result
     */
    async request (method, params = {}, expectResponse = true) {
        const id = ++this.commandId
        const command = JSON.stringify({ id, method, params })

        if (!expectResponse) {
            this.log.debug(`Command: ${command}`)
            return this.ws.send(command)
        }

        return await new Promise((resolve, reject) => {
            setTimeout(reject, COMMAND_TIMEOUT)
            this.emitter.once(id, (data) => {
                if (data && typeof data.error === 'string') {
                    const error = errors[data.error] ? new errors[data.error](data.message) : new errors.UnknownError()
                    return reject(error)
                }

                this.log.debug(`Received result for ${method}: ${limit(data)}`)
                resolve(data)
            })

            this.log.debug(`Command: ${command}`)
            this.ws.send(command)
        })
    }

    /**
     * check if options define Opera TV Emulator as capability
     */
    isEmulator () {
        return !!this.opts.vdi
    }

    /**
     * run Opera TV emulator session
     */
    async startEmulator () {
        this.emulator = new OperaTVEmulator(this.opts)
        await this.emulator.initializeProfile(this.sessionId)
        await this.emulator.boot()
    }
}

for (let [cmd, fn] of toPairs(commands)) {
    HbbTVDriver.prototype[cmd] = fn
}

export default HbbTVDriver
export { SCRIPT_TIMEOUT, IMPLICIT_WAIT_TIMEOUT, PAGE_LOAD_TIMEOUT, SUPPORTED_LOCATOR_STRATEGIES, HbbTVDriver }
