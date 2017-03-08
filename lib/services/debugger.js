import WebSocket from 'ws'

import FrontendService from './service'
import middleware from './middleware'
import Request from './utils/request'

const WEBSOCKET_PORT = 9222
const SERVER_DOMAINS = ['Network']
const requestList = []
let ENABLED_DOMAINS = []

export default class DebuggerService extends FrontendService {
    constructor (io, uuid) {
        super(io, 'debugger', 'DebuggerService')
        this.supportedDomains = []

        this.wss = new WebSocket.Server({
            perMessageDeflate: false,
            host: '0.0.0.0',
            port: WEBSOCKET_PORT,
            path: `/devtools/page/${uuid}`
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

            /**
             * trigger events in case the dev tool was refreshed
             * (these are normally triggered on page load but in case of
             * a refresh we can emit them here)
             */
            if (domain.toLowerCase() === 'css') {
                this.socket.emit(domain, { method: 'styleSheetAdded' })
            }

            if (domain.toLowerCase() === 'debugger') {
                this.socket.emit(domain, { method: 'scriptParsed' })
            }

            if (domain.toLowerCase() === 'runtime') {
                this.socket.emit(domain, { method: 'executionContextCreated' })
            }

            if (domain.toLowerCase() === 'page') {
                this.socket.emit(domain, { method: 'frameNavigated' })
            }

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
            domain,
            params: msg.params || {}
        })
    }

    broadcast (msg) {
        if (!this.ws) {
            return
        }

        /**
         * check for server side domain handlers
         */
        if (middleware[msg._domain] && middleware[msg._domain][msg._method]) {
            const result = middleware[msg._domain][msg._method].call(this, msg.result, requestList)
            return this.broadcast({ id: msg.id, result })
        }

        delete msg._domain
        delete msg._method

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
        const request = new Request(req)

        if (request.fullUrl.includes('samsungcloudsolution')) {
            return
        }

        requestList.push(request)

        /**
         * don't do any analytics if network is not enabled
         */
        if (!this.isDomainSupported('Network')) {
            return
        }

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

export { WEBSOCKET_PORT }
