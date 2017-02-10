import WebSocket from 'ws'

import FrontendService from './service'
import Request from './utils/request'

const WEBSOCKET_PORT = 9222
const SERVER_DOMAINS = ['Network']
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
            this.supportedDomains = msg.supportedDomains.concat(SERVER_DOMAINS)
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
        if (!this.isDomainSupported(msg)) {
            return
        }

        this.socket.emit(domain, {
            id: msg.id,
            method,
            params: msg.params || {}
        })
    }

    broadcast (msg) {
        if (!this.ws) {
            return
        }

        const msgString = JSON.stringify(msg)
        this.log.debug(`Outgoing debugger message: ${msgString}`)

        /**
         * broadcast to clients that have open socket connection
         */
        return this.wss.clients.forEach((client) => {
            if (client.readyState !== WebSocket.OPEN) {
                return
            }

            return this.ws.send(msgString)
        })
    }

    /**
     * check if domain is currently supported/enabled
     * Usage:
     *  - isDomainSupported({ method: 'Network.loadingFinished', params: { ... }})
     *  - isDomainSupported('Network')
     *
     * @param   [Object|String] msg  either:
     *                                 - a WS message like first example above or
     *                                 - string if you want to specify the domain directly
     * @returns [Boolean]            true if the specified domain is supported/enabled
     */
    isDomainSupported (msg) {
        const method = msg.method || ''
        const splitPoint = method.indexOf('.')
        const domain = typeof msg === 'string' ? msg : method.slice(0, splitPoint)
        return ENABLED_DOMAINS.includes(domain)
    }

    registerListeners (socket) {
        super.connect(socket)
    }

    logRequest (req, newRequest) {
        /**
         * don't do any analytics if network is not enabled
         */
        if (!this.isDomainSupported('Network')) {
            return
        }

        const request = new Request(req)

        this.log.debug('requestWillBeSent', request.requestId, request.documentURL)
        this.broadcast({ method: 'Network.requestWillBeSent', params: request.requestWillBeSent() })

        if (req.stale) {
            this.broadcast({ method: 'Network.requestServedFromCache', params: request.requestServedFromCache() })
        }

        newRequest.on('data', (chunk) =>
            this.broadcast({
                method: 'Network.dataReceived',
                params: request.dataReceived(chunk)
            })
        )

        newRequest.on('end', (chunk) => {
            this.log.debug('loadingFinished', request.requestId, request.fullUrl)
            this.broadcast({
                method: 'Network.loadingFinished',
                params: request.loadingFinished(chunk)
            })

            if (request.type === 'Stylesheet') {
                this.broadcast({
                    method: 'CSS.styleSheetAdded',
                    params: request.styleSheetAdded()
                })
            }
        })

        newRequest.then((response) => {
            this.broadcast({
                method: 'Network.responseReceived',
                params: request.responseReceived(response)
            })
        })

        newRequest.catch((error) => {
            return this.broadcast({
                method: 'Network.loadingFailed',
                params: request.loadingFailed(error)
            })
        })
    }
}
