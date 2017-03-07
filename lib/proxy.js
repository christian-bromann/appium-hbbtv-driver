import os from 'os'
import fs from 'fs'
import io from 'socket.io'
import ejs from 'ejs'
import path from 'path'
import express from 'express'
import favicon from 'serve-favicon'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import request from 'request-promise-native'
import { v4 as uuidV4 } from 'uuid'

import logger from './logger'
import { DebuggerService, WebdriverService } from './services'
import { WEBSOCKET_PORT } from './services/debugger'
import { getDomain, hasGzipEncoding, getIpAddress, readConfig, writeConfig } from './utils'

const cookieJar = request.jar()
let requestIds = 0

export default class Proxy {
    constructor (port = 8080) {
        this.port = port
        this.app = express()
        this.log = logger('Proxy')
        this.uuid = uuidV4()
        this.ipAddress = getIpAddress('eth1') || getIpAddress('wlan0')

        /**
         * make sure connection to TV was established
         */
        if (!this.ipAddress) {
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
        this.app.use(favicon(path.resolve(__dirname, '..', 'static', 'favicon.png')))

        /**
         * settings page
         */
        this.app.use(express.static(path.resolve(__dirname, '..', 'static')))
        this.app.set('view engine', 'ejs')
        this.app.engine('html', ejs.renderFile)
        this.app.get('/settings', ::this.getSettings)
        this.app.post('/settings', ::this.postSettings)

        /**
         * request id middleware for debugger
         */
        this.app.use(::this.requestIdMiddleware)

        /**
         * route all packages through server
         */
        this.app.get('/json', ::this.debuggerJson)
        this.app.get('*', ::this.proxy)
    }

    /**
     * check if request forwarded from another page and replace host with host
     * the requets was referred to
     */
    shouldApplyReferredHost (req) {
        return req.cookies.requestId &&
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
            gzip: hasGzipEncoding(req) && this.isHbbTVApp(req),
            jar: cookieJar
        })
        this.debugger.logRequest(req, requestCall)

        /**
         * once we've loaded the page just stream assets
         */
        if (!this.isHbbTVApp(req)) {
            requestCall.catch((e) => this.requestError(e, target))
            return requestCall.pipe(proxyRes)
        }

        /**
         * request HbbTV app
         */
        this.log.info('request HbbTV app at %s', target)
        requestCall.then(
            (res) => this.handleResponse(res, proxyRes, req, target),
            (e) => this.requestError(e, target)
        )
    }

    handleResponse (res, proxyRes, req, target) {
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

        /**
         * don't inject anything if response is not an hbbtv app
         */
        if (!res.headers['content-type'].includes('hbbtv') && res.headers['content-type'] !== 'text/html') {
            /**
             * fix content-length of asset (gzipped files get decompressed)
             */
            if (res.headers['content-length'] !== content.length) {
                proxyRes.set('content-length', content.length)
            }

            this.log.debug(`skip injection, wrong content type ${res.headers['content-type']} for ${target}`)
            return proxyRes.send(content)
        }

        this.log.debug(`inject frontend scripts on ${target}`)

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
        content = content.replace('<head>', `
            <head>
            <script src="http://${this.ipAddress}:8080/socket.io/socket.io.js"></script>
            <script type="text/javascript">
                //<![CDATA[
                window.socket = window.io();
                window.log = function () {
                    var args = Array.prototype.slice.call(arguments);
                    window.socket.emit('log', args)
                }
                window.onerror = function (errorMsg, url, lineNumber) {
                    window.socket.emit('error:window', {
                       errorMsg: errorMsg,
                       url: url,
                       lineNumber: lineNumber
                    })
                };
                //]]>
            </script>
        `)

        /**
         * inject services at the end of the file
         */
        content = content.replace('</body>',
            Proxy.injectScript(WebdriverService.name, this.webdriver.getScript()) + '</body>')
        content = content.replace('</body>',
            Proxy.injectScript(DebuggerService.name, this.debugger.getScript()) + '</body>')

        proxyRes.set('content-length', content.length)
        proxyRes.send(content)
    }

    debuggerJson (req, res) {
        const interfaces = os.networkInterfaces()
        const ip = interfaces.wlan0.filter((ifconfig) => ifconfig.family === 'IPv4')[0].address
        const devtoolsPath = `${ip}:${WEBSOCKET_PORT}/devtools/page/${this.uuid}`
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
        if (!req.cookies.requestId) {
            res.cookie('requestId', `${++requestIds}.1`)
            return next()
        }

        let [requestId, subId] = req.cookies.requestId.split('.')
        subId = parseInt(subId, 10) + 1
        res.cookie('requestId', `${requestId}.${subId}`)
        next()
    }

    static injectScript (name, script) {
        return `
        <script type="text/javascript">
            //<![CDATA[
            try {
                ${script}
            } catch (e) {
                window.socket.emit('error:injectScript', {
                    name: "${name}",
                    errorMsg: e.message
                })
            }
            //]]>
        </script>
        `
    }

    isHbbTVApp (req) {
        /**
         * check accept header
         */
        if (typeof req.headers.accept === 'string' && req.headers.accept.indexOf('hbbtv') > -1) {
            return true
        }

        /**
         * check request url containing html or php
         */
        if (req.url.match(/\.(html|php)/)) {
            return true
        }

        /**
         * check if request url is a directory (e.g. "rtl2.de/hbbtvp")
         */
        if (path.extname(req.url) === '') {
            return true
        }

        return false
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
