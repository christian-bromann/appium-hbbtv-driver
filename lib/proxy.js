import io from 'socket.io'
import path from 'path'
import toPairs from 'lodash.topairs'
import express from 'express'
import request from 'request-promise-native'

import logger from './logger'
import { DebuggerService, WebdriverService } from './services'

export default class Proxy {
    constructor (port = 8080) {
        this.port = port
        this.app = express()
        this.log = logger(path.basename(__filename))

        /**
         * route all packages through server
         */
        this.app.use('/appium', express.static(path.resolve(__dirname, 'driver')))
        this.app.get('*', ::this.proxy)

        /**
         * initialise socket server
         */
        this.server = this.app.listen(port, () => this.log.debug('Started proxy server'))
        this.io = io(this.server)

        /**
         * initialise services
         */
        this.webdriver = new WebdriverService(this.io)
        this.debugger = new DebuggerService(this.io)
    }

    proxy (req, proxyRes) {
        const target = `http://${req.headers.host}${req.url}`
        const requestCall = request({ url: target, headers: req.headers, resolveWithFullResponse: true })

        /**
         * once we've loaded the page just stream assets
         */
        if (!this.isHbbTVApp(req)) {
            requestCall.catch((error) => this.log.error(error.message))
            return requestCall.pipe(proxyRes)
        }

        /**
         * request HbbTV app
         */
        this.log.info('request HbbTV app at %s%s', req.headers.host, req.url)
        requestCall.then(
            (res) => this.handleResponse(res, proxyRes),
            (e) => this.log.errorAndThrow(e)
        )
    }

    handleResponse (res, proxyRes) {
        this.log.debug('inject frontend scripts')
        let content = res.body

        /**
         * propagate headers
         */
        for (let [key, value] of toPairs(res.headers)) {
            proxyRes.set(key, value)
        }

        /**
         * initialise socket connection before everything else
         */
        content = content.replace('<head>', `
            <head>
            <script src="http://192.168.1.7:8080/socket.io/socket.io.js"></script>
            <script type="text/javascript">
                //<![CDATA[
                window.socket = window.io();
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
            Proxy.inject(WebdriverService.name, this.webdriver.getScript()) + '</body>')
        content = content.replace('</body>',
            Proxy.inject(DebuggerService.name, this.debugger.getScript()) + '</body>')

        proxyRes.send(content)
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

        return false
    }

    close () {
        this.log.debug('stop proxy server')
        this.server.close()
    }
}
