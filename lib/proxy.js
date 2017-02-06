import fs from 'fs'
import io from 'socket.io'
import path from 'path'
import toPairs from 'lodash.topairs'
import express from 'express'
import request from 'request-promise-native'
import logger from './logger'

export default class AppProxy {
    constructor (port = 8080) {
        this.port = port
        this.app = express()
        this.log = logger(path.basename(__filename))

        /**
         * route all packages through server
         */
        this.app.use('/appium', express.static(path.resolve(__dirname, 'driver')))
        this.app.get('*', ::this.proxy)

        this.server = this.app.listen(port, () => this.log.debug('Started proxy server'))
        this.io = io(this.server)

        this.log.debug('Trying to connect to frontend driver ...')
        this.io.on('connection', (socket) => {
            this.log.debug('Connected to smart TV')
            this.socket = socket

            /**
             * Todo: consolidate in channels
             */
            this.socket.on('error:window', (e) => this.log.error(e))
            this.socket.on('error:inject', (e) => this.log.error(e))

            this.socket.on('connection', (msg) => this.log.info(`frontend driver connection: ${msg}`))
            this.socket.on('debug', (msg) => this.log.debug(msg))
        })
        this.io.on('disconnected', () => {
            this.log.debug('Disconnected to frontend driver')
            delete this.socket
        })
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
        this.log.debug('inject frontend driver script')
        let content = res.body

        /**
         * propagate headers
         */
        for (let [key, value] of toPairs(res.headers)) {
            proxyRes.set(key, value)
        }

        let script = fs.readFileSync(path.resolve(__dirname, 'driver', 'driver.js'))

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
         * inject actual frontend driver at the end of the file
         */
        content = content.replace('</body>', `
            <script type="text/javascript">
                //<![CDATA[
                try {
                    ${script}
                } catch (e) {
                    window.socket.emit('error:inject', {
                       errorMsg: e.message
                    })
                }
                //]]>
            </script></body>
        `)

        proxyRes.send(content)
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

    isConnected () {
        return Boolean(this.socket)
    }

    close () {
        this.log.debug('stop proxy server')
        this.server.close()
    }
}
