import fs from 'fs'
import tmp from 'tmp'
import path from 'path'
import request from 'request-promise-native'
import { parseString } from 'xml2js'

import VirtualBox from 'virtualbox-promise'
import logger from './logger'

const VIRTUALBOX_PROFILE_PATH = path.join(__dirname, '..', '..', 'lib', 'profiles', 'operatvemulator.xml')
const VIRTUALBOX_PROFILE = fs.readFileSync(VIRTUALBOX_PROFILE_PATH).toString()
const HOST = 'localhost'
const PORT = 5555
const BOOT_TIMEOUT = 30000

export default class OperaTVEmulator {
    constructor (opts) {
        this.opts = opts
    }

    /**
     * creates a temporary virtualbox profile for the Opera TV simulator
     */
    async initializeProfile (sessionId) {
        this.runningUUID = sessionId

        logger.debug('create AppiumHbbTVDriver profile in VirtualBox')
        const tmpobj = tmp.fileSync({ postfix: '.vbox' })
        const template = VIRTUALBOX_PROFILE.replace('%LOCATION%', this.opts.vdi)
                                           .replace(/%UUID%/g, this.opts.uuid)
                                           .replace(/%SESSION_ID%/g, sessionId)
        fs.writeFileSync(tmpobj.name, template)

        try {
            await VirtualBox.manage(['registervm', tmpobj.name])
        } catch (err) {
            logger.errorAndThrow(err)
        }
    }

    async clearProfile (uuid = this.runningUUID) {
        await VirtualBox.manage(['unregistervm', uuid])
    }

    /**
     * boots emulator, waits until loaded
     */
    async boot () {
        logger.debug('Booting emulator ...')

        /**
         * throw properly when vdi medium couldn't be loaded
         */
        try {
            await VirtualBox.manage(['startvm', 'AppiumHbbTVDriver'])
        } catch (err) {
            logger.errorAndThrow(err)
        }

        this.settings = await this.getSettings()
        logger.debug('emulator booted')
    }

    async getSettings () {
        const response = await request.get(`http://${HOST}:${PORT}/scripts/main.py/handler`, {
            qs: { cmd: 'getSettings' }
        })

        return await new Promise((resolve, reject) => parseString(response, (err, result) => {
            if (err) reject(err)
            resolve(result.config)
        }))
    }

    async powerOff (uuid = this.runningUUID) {
        logger.debug(`shutting down emulator with UUID {${uuid}} ...`)
        await VirtualBox.manage(['controlvm', uuid, 'poweroff'])
        logger.debug('emulator shut down')
    }
}
