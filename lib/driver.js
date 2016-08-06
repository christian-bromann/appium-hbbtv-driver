import logger from './logger'
import toPairs from 'lodash.topairs'

import { BaseDriver } from 'appium-base-driver'
import OperaTVEmulator from './emulator'
import commands from './commands'
import AppProxy from './proxy'
import { desiredCapConstraints, desiredCapValidation } from './desired-caps'

class HbbTVDriver extends BaseDriver {
    constructor (opts, shouldValidateCaps) {
        super(opts, shouldValidateCaps)

        this.desiredCapConstraints = desiredCapConstraints
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
    async start () {
        /**
         * run Opera TV emulator via VirtualBox
         */
        if (this.isEmulator()) {
            logger.debug('Run Opera TV emulator session')
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

        logger.debug(`Start session ${this.sessionId}`)
        await this.start()

        this.proxy = new AppProxy()

        return [this.sessionId, this.caps]
    }

    async deleteSession () {
        logger.debug('Deleting HbbTV session')

        if (this.isEmulator()) {
            await this.emulator.powerOff()
            await this.resetEmulator()
        }

        this.proxy.close()
        await super.deleteSession()
        logger.debug('Bye 👋 !')
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
