import fs from 'fs'
import io from 'socket.io'
import ejs from 'ejs'
import path from 'path'
import express from 'express'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import request from 'request-promise-native'
import { v4 as uuidV4 } from 'uuid'

import logger from './logger'
import { DebuggerService, WebdriverService } from './services'
import { WEBSOCKET_PORT } from './services/debugger'
import { getDomain, hasGzipEncoding, getIpAddress, readConfig, writeConfig } from './utils'

const SOCKETIO_TEMPLATE = fs.readFileSync(path.resolve(__dirname, '..', 'static', 'socket-io.tpl.html'), 'utf8')
const SERVICE_TEMPLATE = fs.readFileSync(path.resolve(__dirname, '..', 'static', 'service.tpl.html'), 'utf8')

const cookieJar = request.jar()
let frameIds = 0
const subIds = {}

export default class Proxy {
    constructor (port = 8080) {
        this.port = port
        this.app = express()
        this.log = logger('Proxy')
        this.uuid = uuidV4()
        this.tvIPAddress = getIpAddress('eth1')
        this.piIPAddress = getIpAddress('eth0') || getIpAddress('wlan0')

        /**
         * make sure connection to TV was established
         */
        if (!this.tvIPAddress) {
            this.log.errorAndThrow('Couldn\'t find a connection to TV. Please check network settings.')
        }

        /**
         * initialise socket server
         */
        this.server = this.app.listen(port, () => this.log.debug('Started proxy server'))
        this.io = io(this.server)
        this.io.on('connection', (socket) => {
            socket.on('log', (args) => console.log.apply(console, args))
            socket.on('error:injectScript', (e) => this.log.error(e))

            if (!this.hasInjectedScript) {
                this.webdriver.reloadOnConnect = true
            }
        })

        /**
         * initialise services
         */
        this.webdriver = new WebdriverService(this.io)
        this.debugger = new DebuggerService(this.io, this.uuid)

        /**
         * initialise external middleware
         */
        this.app.use(bodyParser.urlencoded({ extended: false }))
        this.app.use(bodyParser.json())
        this.app.use(cookieParser())
        this.app.use(express.static(path.resolve(__dirname, '..', 'static')))
        this.app.set('view engine', 'ejs')
        this.app.engine('html', ejs.renderFile)

        /**
         * proxy routes
         */
        this.app.get('/favicon.ico', ::this.serveFavicon)
        this.app.get('/settings', ::this.getSettings)
        this.app.get('/json', ::this.debuggerJson)
        this.app.post('/settings', ::this.postSettings)

        /**
         * route all packages through server
         */
        this.app.use(::this.requestIdMiddleware)
        this.app.use(::this.proxyFilter)
        this.app.get('*', ::this.proxy)
    }

    /**
     * check if request forwarded from another page and replace host with host
     * the requets was referred to
     */
    shouldApplyReferredHost (req) {
        return false && req.cookies.requestId &&
            getDomain(req.headers.host) === getDomain(this.referredHost) &&
            req.headers.host !== this.referredHost
    }

    proxy (req, proxyRes) {
        const host = this.shouldApplyReferredHost(req) ? this.referredHost : req.headers.host

        if (host !== req.headers.host) {
            req.headers.host = host
        }

        const target = `${req.protocol}://${host}${req.url}`
        const requestCall = request({
            url: target,
            headers: req.headers,
            resolveWithFullResponse: true,
            time: true,
            /**
             * decompress gzipped requests (excluding assets)
             */
            gzip: hasGzipEncoding(req),
            jar: cookieJar
        })

        this.debugger.frameStartedLoading(proxyRes._headers)
        this.debugger.frameNavigated(req)
        this.debugger.logRequest(req, requestCall)

        if (hasGzipEncoding(req)) {
            delete req.headers['accept-encoding']
        }

        /**
         * request HbbTV app
         */
        this.log.info('request HbbTV app at %s', target)
        requestCall.then(
            (res) => this.handleResponse(res, proxyRes, req),
            (e) => this.requestError(e, target)
        )
    }

    handleResponse (res, proxyRes, req) {
        let content = res.body

        /**
         * propagate headers
         */
        for (let [key, value] of Object.entries(res.headers)) {
            /**
             * all requested files get decompressed therefor ignore content encoding
             */
            if (key === 'content-encoding' && value === 'gzip') {
                continue
            }
            proxyRes.set(key, value)
        }

        this.log.debug(`inject frontend scripts on ${res.request.uri.href}`)

        /**
         * check if host has changed (e.g. when request gets redirected)
         */
        this.referredHost = req.headers.host
        if (req.headers.referer || res.req._headers.host !== req.headers.host) {
            this.referredHost = res.req._headers.host
        }

        /**
         * initialise socket connection before everything else
         */
        content = content.replace('<head>', '<head>' + ejs.render(SOCKETIO_TEMPLATE, {
            tvIPAddress: this.tvIPAddress
        }))

        /**
         * inject services at the end of the file
         */
        content = content.replace('</body>', ejs.render(SERVICE_TEMPLATE, {
            name: WebdriverService.name,
            script: this.webdriver.getScript()
        }) + '</body>')
        content = content.replace('</body>', ejs.render(SERVICE_TEMPLATE, {
            name: DebuggerService.name,
            script: this.debugger.getScript()
        }) + '</body>')

        this.hasInjectedScript = true
        this.faviconUrl = `${req.protocol}://${this.referredHost}/favicon.ico`
        proxyRes.set('content-length', content.length)
        proxyRes.send(content)
    }

    debuggerJson (req, res) {
        const devtoolsPath = `${this.piIPAddress}:${WEBSOCKET_PORT}/devtools/page/${this.uuid}`
        return res.json({
            description: 'HbbTV application',
            devtoolsFrontendUrl: `/devtools/inspector.html?ws=${devtoolsPath}`,
            title: 'some title',
            type: 'application/hbbtv',
            url: 'http://hbbtv.zdf.de',
            webSocketDebuggerUrl: `ws://${devtoolsPath}`
        })
    }

    requestError (e, target) {
        const message = `request failed with status code ${e.message.slice(0, 3)} - ${target}`
        this.log.error(new Error(message))
    }

    requestIdMiddleware (req, res, next) {
        const target = `${req.protocol}://${req.hostname}${req.url}`

        /**
         * apply requestId to all request where frameId is not set or set new
         * frameId for requests with same request hosts
         */
        if (!req.cookies.frameId || req.cookies.requestIdHost === target) {
            const newFrameId = `${++frameIds}.1`
            const newRequestId = newFrameId + '00'

            req.cookies.frameId = newFrameId
            req.cookies.requestId = newRequestId
            res.cookie('frameId', newFrameId)
            res.cookie('requestId', newRequestId)
            res.cookie('requestIdHost', target)
            return next()
        }

        const frameId = req.cookies.frameId.split('.')[0]

        if (!subIds[frameId]) {
            subIds[frameId] = 1
        }

        const subId = ++subIds[frameId]
        const requestId = `${frameId}.${subId}`
        res.cookie('frameId', req.cookies.frameId)
        res.cookie('requestId', requestId)
        req.cookies.requestId = requestId
        next()
    }

    /**
     * Sends a head request first to check if requested source is an HbbTV application.
     * If source is an HbbTV file forward to the proxy handler otherwise pipe response
     * directly to the proxy.
     */
    proxyFilter (req, proxyRes, next) {
        const target = `${req.protocol}://${req.hostname}${req.url}`
        request.head(target, (err, res, body) => {
            if (err) {
                return this.requestError(err, target)
            }

            if (!res.headers['content-type'] || res.headers['content-type'].match(/(hbbtv|html)/)) {
                return next()
            }

            const requestCall = request({
                url: target,
                headers: req.headers,
                time: true,
                resolveWithFullResponse: true
            })

            this.debugger.logRequest(req, requestCall)
            requestCall.catch((e) => this.requestError(e, target))
            return requestCall.pipe(proxyRes)
        })
    }

    serveFavicon (req, res) {
        /**
         * send own icon if no HbbTV was loaded so far
         */
        if (!this.faviconUrl) {
            return res.sendFile(path.resolve(__dirname, '..', 'static', 'favicon.png'))
        }

        /**
         * redirect to icon of loaded HbbTV app
         */
        res.redirect(302, this.faviconUrl)
    }

    getSettings (req, res) {
        res.render('settings.html', readConfig())
    }

    postSettings (req, res) {
        this.log.info('Write config to file:', req.body)
        writeConfig(req.body)
        res.redirect('/settings')
    }

    close () {
        this.log.debug('stop proxy server')
        this.server.close()
    }
}
