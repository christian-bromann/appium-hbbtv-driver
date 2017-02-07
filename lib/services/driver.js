import fs from 'fs'
import path from 'path'

import logger from './logger'

export default class DriverService {
    constructor (io) {
        this.io = io.of('/webdriver')
        this.log = logger('DriverService')

        this.log.debug('Trying to connect to frontend driver ...')
        this.io.on('connection', ::this.registerListeners)
        this.driver.on('disconnected', ::this.disconnect)
    }

    registerListeners (socket) {
        this.log.debug('Connected to smart TV')
        this.socket = socket

        /**
         * Todo: consolidate in channels
         */
        this.socket.on('error:window', (e) => this.log.error(e))
        this.socket.on('error:injectScript', (e) => this.log.error(e))

        this.socket.on('connection', (msg) => this.log.info(`frontend driver connection: ${msg}`))
        this.socket.on('debug', (msg) => this.log.debug(msg))
    }

    disconnect () {
        this.log.debug('Disconnected to frontend driver')
        delete this.socket
    }

    static getScript () {
        return fs.readFileSync(path.resolve(__dirname, '..', 'driver', 'driver.js'))
    }
}
