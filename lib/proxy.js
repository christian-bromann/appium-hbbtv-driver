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
import {
    hasGzipEncoding, getIpAddress, readConfig, writeConfig, getDescription, getDeviceConfig,
    isAlreadyRegistered
} from './utils'

const SOCKETIO_TEMPLATE = fs.readFileSync(path.resolve(__dirname, '..', 'static', 'socket-io.tpl.html'), 'utf8')
const SERVICE_TEMPLATE = fs.readFileSync(path.resolve(__dirname, '..', 'static', 'service.tpl.html'), 'utf8')
const DEVTOOLS_PATH = path.resolve(__dirname, '..', 'node_modules', 'chrome-devtools-frontend', 'release')

const cookieJar = request.jar()
let frameIds = 0
const subIds = {}

export default class Proxy {
    constructor (port = 8080) {
        this.pageInfo = {}
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
        this.app.use('/devtools', express.static(DEVTOOLS_PATH))
        this.app.get('/inspector.html', ::this.getInspector)
        this.app.get('/favicon.ico', ::this.serveFavicon)
        this.app.get('/settings', ::this.getSettings)
        this.app.get('/json', ::this.debuggerJson)
        this.app.get('/nodeconfig.json', ::this.getNodeConfig)
        this.app.post('/settings', ::this.postSettings)
        this.app.post('/register', ::this.registerNode)

        /**
         * route all packages through server
         */
        this.app.use(::this.requestIdMiddleware)
        this.app.use(::this.proxyFilter)
        this.app.get('*', ::this.proxy)
    }

    proxy (req, proxyRes) {
        const target = `${req.protocol}://${req.hostname}${req.url}`
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

        const url = `${req.protocol}://${req.hostname}`
        const titleMatch = content.match(/<title>(.*)<\/title>/)
        this.pageInfo = {
            favicon: `${url}/favicon.ico`,
            url,
            title: titleMatch ? titleMatch[1] : undefined,
            description: getDescription(content)
        }

        this.hasInjectedScript = true
        proxyRes.set('content-length', content.length)
        proxyRes.send(content)
    }

    debuggerJson (req, res) {
        const devtoolsPath = `${this.piIPAddress}:${WEBSOCKET_PORT}/devtools/page/${this.uuid}`
        return res.json({
            description: this.pageInfo.description,
            devtoolsFrontendUrl: `/devtools/inspector.html?ws=${devtoolsPath}`,
            title: this.pageInfo.title,
            type: 'page',
            url: this.pageInfo.url,
            webSocketDebuggerUrl: `ws://${devtoolsPath}`
        })
    }

    async getNodeConfig (req, res) {
        let deviceConfig

        try {
            deviceConfig = await getDeviceConfig()
        } catch (e) {
            return res.status(403).json({
                message: 'Device not found or could not be detected',
                error: e.message
            })
        }

        return res.json(deviceConfig)
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
                this.requestError(err, target)
                return proxyRes.status(409).send(err.message || 'Not found')
            }

            /**
             * only proxy resource if content type is an HbbTV application
             */
            if (res.headers['content-type'] && res.headers['content-type'].match(/hbbtv/)) {
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
        if (!this.pageInfo.favicon) {
            return res.sendFile(path.resolve(__dirname, '..', 'static', 'favicon.png'))
        }

        /**
         * redirect to icon of loaded HbbTV app
         */
        res.redirect(302, this.pageInfo.favicon)
    }

    async getSettings (req, res) {
        let proxyConfig = readConfig()
        const { host, port } = proxyConfig.data

        if (host && port) {
            proxyConfig.data.isAlreadyRegistered = await isAlreadyRegistered(host, port, this.uuid)
        }

        res.render('settings.html', proxyConfig)
    }

    async postSettings (req, res) {
        this.log.info('Write config to file:', req.body)
        writeConfig(req.body)

        /**
         * register node if settings were given
         */
        if (req.body.host && req.body.port) {
            return await this.registerNode(req.body, res)
        }

        return res.redirect('/settings')
    }

    async registerNode (body, res) {
        const { host, port } = body
        let deviceConfig

        try {
            deviceConfig = await getDeviceConfig()
            deviceConfig.configuration.id = this.uuid
        } catch (e) {
            return res.status(403).json({
                message: 'Device not found or could not be detected',
                error: e.message
            })
        }

        try {
            this.log.info('Trying to register to grid with config', deviceConfig)
            request({
                url: `http://${host}:${port}/grid/register`,
                method: 'POST',
                body: deviceConfig,
                json: true,
                resolveWithFullResponse: true
            })
        } catch (e) {
            return res.status(403).send('Could not register to hub: ' + e.message)
        }

        this.log.info(`Successfully registered to Selenium hub at ${host}:${port}`)
        return res.redirect('/settings')
    }

    getInspector (req, res) {
        if (this.debugger.isBlocked) {
            return res.status(409).send('The debugger is already used by someone else')
        }

        return res.render('inspector.html', {
            uuid: this.uuid,
            host: this.piIPAddress
        })
    }

    close () {
        this.log.info('stop proxy server')
        this.server.close()
    }
}
