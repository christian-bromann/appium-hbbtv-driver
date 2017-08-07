import request from 'request-promise-native'

import logger from '../logger'
import { getIpAddress } from '../utils'

const log = logger('SeleniumHub')

export default class SeleniumHub {
    constructor (host, port) {
        this.host = host
        this.port = port
        this.isRegistered = false
    }

    /**
     * register node to hub
     */
    async register (capabilities) {
        const piIPAddress = getIpAddress('eth0') || getIpAddress('wlan0')
        let result

        if (!this.host || !this.port) {
            throw new Error('No host or port specified')
        }

        const deviceConfig = {
            capabilities: [capabilities],
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

        try {
            log.info('Trying to register to grid with config', deviceConfig)
            let response = await request({
                url: `http://${this.host}:${this.port}/grid/register`,
                method: 'POST',
                body: deviceConfig,
                json: true,
                resolveWithFullResponse: true
            })
            result = `Successfully registered to Selenium Hub at ${this.host}:${this.port}<br>`
            result += `Response:<br><pre>${JSON.stringify(response, null, 4)}</pre>`
            this.isRegistered = true
        } catch (e) {
            this.isRegistered = false
            result = new Error(`Could not register to hub: ${e.message}`)
            log.error(result)
        }

        return result
    }

    static async findNode (host, port) {
        try {
            await request({
                uri: `http://${host}:${port}/grid/api/proxy?id=${host}:${port}`,
                method: 'GET',
                timeout: 10000,
                json: true
            })

            return true
        } catch (err) {
            log.error(`Hub down or not responding: ${err.message}`)
            return false
        }
    }
}
