import fs from 'fs'
import path from 'path'

import logger from './logger'

export default class DebuggerService {
    constructor (io) {
        this.io = io.of('/debugger')
        this.log = logger('DebuggerService')

        this.log.debug('Trying to connect to remote debugger ...')
        this.io.on('connection', ::this.registerListeners)
        this.io.on('disconnected', ::this.disconnect)
    }

    registerListeners (socket) {
        this.log.debug('Connected to remote debugger')
        this.socket = socket
    }

    disconnect () {
        this.log.debug('Disconnected to frontend driver')
        delete this.socket
    }

    static getScript () {
        return fs.readFileSync(path.resolve(__dirname, '..', 'debugger', 'debugger.js'))
    }
}
