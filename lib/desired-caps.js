import logger from './logger'

const desiredCapConstraints = {
    /**
     * e.g. "Tizen" (for newer Samsung devices)
     */
    platformName: {
        isString: true
    },

    /**
     * e.g. "2.1.0"
     */
    platformVersion: {
        isString: true
    },

    /**
     * requires deviceName like "[TV] Samsung"
     * this is configurable in the TV settings
     */
    deviceName: {
        isString: true
    },

    /**
     * path to virtual disk image (vdi) of the Opera TV emulator
     */
    vdi: {
        isString: true
    },

    /**
     * UUID of emulator hard disk
     */
    uuid: {
        isString: true
    }
}

/**
 * validation helper to for more complex capabilities
 */
function desiredCapValidation (caps) {
    /**
     * make sure if vdi and uuid are always set together
     */
    if (Boolean(caps.vdi) !== Boolean(caps.uuid)) {
        logger.errorAndThrow(caps.vdi ? 'UUID of emulator hard disk is missing' : 'Path to VDI file is missing')
    }

    return true
}

export { desiredCapConstraints, desiredCapValidation }
export default desiredCapConstraints
