import WebSocket from 'ws'

import FrontendService from './service'

const WEBSOCKET_PORT = 9222
let ENABLED_DOMAINS = []

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
         * enable domain agent
         */
        if (method === 'enable' && this.supportedDomains.includes(domain)) {
            this.log.info(`Enable domain ${domain}`)
            ENABLED_DOMAINS.push(domain)
            return this.broadcast({ id: msg.id, params: {} })
        }

        /**
         * disable domain agent
         */
        if (method === 'disable') {
            this.log.info(`Disable domain ${domain}`)
            const pos = ENABLED_DOMAINS.indexOf(domain)
            ENABLED_DOMAINS.splice(pos, pos + 1)
            return this.broadcast({ id: msg.id, params: {} })
        }

        /**
         * don't propagate domains that are not supported or disabled
         */
        if (ENABLED_DOMAINS.includes(domain)) {
            return
        }

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
