import logger from './logger'

const desiredCapConstraints = {
    /**
     * platformName has to be 'HbbTV'
     */
    platformName: {
        presence: true,
        isString: true,
        inclusionCaseInsensitive: ['HbbTV']
    },

    /**
     * requires deviceName like "Samsung UE65JS9500"
     */
    deviceName: {
        presence: true,
        isString: true
    },

    /**
     * differentiate HbbTV support for v1.5 or v2.0 and up
     */
    platformVersion: {},

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