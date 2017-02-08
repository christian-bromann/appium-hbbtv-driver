import fs from 'fs'
import path from 'path'

import logger from '../logger'

export default class FrontendService {
    constructor (io, namespace, serviceName) {
        this.namespace = namespace
        this.serviceName = serviceName
        this.io = io.of(`/${namespace}`)
        this.log = logger(serviceName)

        this.log.debug(`Trying to connect to ${serviceName} ...`)
        this.io.on('connection', ::this.connect)
        this.io.on('disconnected', ::this.disconnect)
    }

    disconnect () {
        this.log.debug(`Disconnected from ${this.serviceName}`)
        delete this.socket
    }

    getScript () {
        return fs.readFileSync(path.resolve(__dirname, '..', this.namespace, `${this.namespace}.js`))
    }

    emit (command, message) {
        return this.socket.emit(command, message)
    }

    once (command, handler) {
        return this.socket.once(command, handler)
    }
}
