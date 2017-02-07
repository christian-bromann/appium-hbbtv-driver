import path from 'path'

import logger from './logger'
import toPairs from 'lodash.topairs'

import { BaseDriver } from 'appium-base-driver'
import OperaTVEmulator from './emulator'
import commands from './commands'
import AppProxy from './proxy'
import { limit } from './utils'
import { desiredCapConstraints, desiredCapValidation } from './desired-caps'

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
        this.reset()

        /**
         * connect with device
         * ToDo: this only for real device on raspberry pi
         */
        this.proxy = new AppProxy()
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
    async start () {
        /**
         * run Opera TV emulator via VirtualBox
         */
        if (this.isEmulator()) {
            this.log.debug('Run Opera TV emulator session')
            return await this.startEmulator()
        }

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
        await this.start()

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
    async request (cmd, args = {}, expectResponse = true) {
        const { driver } = this.proxy

        if (!driver) {
            return this.log.errorAndThrow('No socket connection to frontend driver was established')
        }

        this.log.debug(`Command: ${cmd} with args: ${limit(args)}`)

        /**
         * return undefined if no response is expected
         */
        if (!expectResponse) {
            driver.emit(cmd, Object.assign({ sessionId: this.sessionId }, args))
            this.log.debug(`No response for ${cmd} expected`)
            return
        }

        return await new Promise((resolve, reject) => {
            setTimeout(reject, COMMAND_TIMEOUT)
            driver.once(`${cmd}Result`, (data) => {
                if (data && data.error) {
                    reject(data.error.message)
                    return this.log.errorAndThrow(data.error.message)
                }

                this.log.debug(`Received result for ${cmd}: ${limit(data)}`)
                resolve(data)
            })

            driver.emit(cmd, Object.assign({ sessionId: this.sessionId }, args))
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
