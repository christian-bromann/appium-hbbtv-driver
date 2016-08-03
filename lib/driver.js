import logger from './logger'

import { BaseDriver } from 'appium-base-driver'
import { desiredCapConstraints, desiredCapValidation } from './desired-caps'

export default class HbbTVDriver extends BaseDriver {
    constructor (opts, shouldValidateCaps) {
        super(opts, shouldValidateCaps)

        this.desiredCapConstraints = desiredCapConstraints
        this.reset()
    }

    /**
     * resets session
     */
    reset () {
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
            return this.startEmulator()
        }

        /**
         * ToDo implement for real TV
         */
        return true
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
    startEmulator () {

    }
}
