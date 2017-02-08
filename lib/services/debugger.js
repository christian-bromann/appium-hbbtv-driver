import WebSocket from 'ws'

import FrontendService from './service'

const WEBSOCKET_PORT = 9222

export default class DebuggerService extends FrontendService {
    constructor (io) {
        super(io, 'debugger', 'DebuggerService')
        this.supportedDomains = []

        this.wss = new WebSocket.Server({
            perMessageDeflate: false,
            port: WEBSOCKET_PORT
        })
        this.wss.on('connection', ::this.connectWebSocket)
    }

    connect (socket) {
        this.log.debug('Connected to smart TV')
        this.socket = socket
        this.socket.on('result', ::this.broadcast)
        this.socket.on('connection', (msg) => {
            this.supportedDomains = msg.supportedDomains
            this.log.info(
                `debugger connection: ${msg.status},\n` +
                `supported domains: ${msg.supportedDomains.join(',')}`
            )
        })
        this.socket.on('debug', (msg) => this.log.debug(msg))
    }

    connectWebSocket (ws) {
        this.log.debug('Connected to remote debugging frontend')
        this.ws = ws
        this.ws.on('message', ::this.handleIncomming)
    }

    handleIncomming (msgString) {
        const msg = JSON.parse(msgString)
        const splitPoint = msg.method.indexOf('.')
        const domain = msg.method.slice(0, splitPoint)
        const method = msg.method.slice(splitPoint + 1)

        /**
         * don't propagate domains that are not supported
         */
        if (this.supportedDomains.indexOf(domain) === -1) {
            return
        }

        this.log.debug(`Incomming debugger message: ${msgString}`)
        this.socket.emit(domain, {
            id: msg.id,
            method,
            params: msg.params || {}
        })
    }

    broadcast (msg) {
        const msgString = JSON.stringify(msg)
        this.log.debug(`Outgoing debugger message: ${msgString}`)
        return this.ws.send(msgString)
    }

    registerListeners (socket) {
        super.connect(socket)
    }
}
