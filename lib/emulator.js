import fs from 'fs'
import tmp from 'tmp'
import path from 'path'
import request from 'request-promise-native'
import { parseString } from 'xml2js'

import VirtualBox from 'virtualbox-promise'
import logger from './logger'

const VIRTUALBOX_PROFILE_PATH = path.join(__dirname, '..', 'lib', 'profiles', 'operatvemulator.xml')
const VIRTUALBOX_PROFILE = fs.readFileSync(VIRTUALBOX_PROFILE_PATH).toString()
const HOST = '0.0.0.0'
const PORT = 5555

export default class OperaTVEmulator {
    constructor (opts) {
        this.opts = opts
        this.log = logger(path.basename(__filename))
    }

    /**
     * creates a temporary virtualbox profile for the Opera TV simulator
     */
    async initializeProfile (sessionId) {
        this.uuid = sessionId

        this.log.debug('create AppiumHbbTVDriver profile in VirtualBox')
        const tmpobj = tmp.fileSync({ postfix: '.vbox' })
        const template = VIRTUALBOX_PROFILE.replace('%LOCATION%', this.opts.vdi)
                                           .replace(/%UUID%/g, this.opts.uuid)
                                           .replace(/%SESSION_ID%/g, sessionId)
        fs.writeFileSync(tmpobj.name, template)

        try {
            await VirtualBox.manage(['registervm', tmpobj.name])
        } catch (err) {
            this.log.errorAndThrow(err)
        }
    }

    async clearProfile (uuid = this.uuid) {
        this.log.debug(`unregister vm profile with uuid: {${uuid}}`)
        await VirtualBox.manage(['unregistervm', uuid])
    }

    /**
     * boots emulator, waits until loaded
     */
    async boot () {
        this.log.debug('Booting emulator ...')

        /**
         * throw properly when vdi medium couldn't be loaded
         */
        try {
            await VirtualBox.manage(['startvm', this.uuid])
        } catch (err) {
            this.log.errorAndThrow(err)
        }

        this.settings = await this.getSettings()
        this.log.debug('emulator booted')
    }

    /**
     * send command to emulator
     * @param  {String} command         command name
     * @param  {Object} [args={}]       arguments
     * @param  {String} [method='post'] method
     * @return {String}                 xml response from emulator
     */
    async sendCmd (command, args = {}, method = 'post') {
        const qs = Object.assign({ cmd: command }, args)
        this.log.debug(`send command: ${command}`, args)
        return await request[method](`http://${HOST}:${PORT}/scripts/main.py/handler`, { qs })
    }

    async getSettings () {
        const response = await this.sendCmd('getSettings', {}, 'get')
        return await new Promise((resolve, reject) => parseString(response, (err, result) => {
            if (err) reject(err)
            resolve(result.config)
        }))
    }

    async powerOff (uuid = this.uuid) {
        this.log.debug(`shutting down emulator with UUID {${uuid}} ...`)
        await VirtualBox.manage(['controlvm', uuid, 'poweroff'])
        this.log.debug('emulator shut down')
    }
}
