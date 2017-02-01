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

        /**
         * route all packages through server
         */
        this.app.all('*', ::this.proxy)

        this.server = this.app.listen(port, () => logger.debug('Started proxy server'))
        this.io = io(this.server)

        logger.debug('Trying to connect to frontend driver ...')
        this.io.on('connection', (socket) => {
            logger.debug('Connected to smart TV')
            this.socket = socket
            this.socket.on('error:window', (e) => logger.error(e))
            this.socket.on('connection', (msg) => logger.info(`frontend driver connection: ${msg}`))
        })
        this.io.on('disconnected', () => {
            logger.debug('Disconnected to frontend driver')
            delete this.socket
        })
    }

    proxy (req, res) {
        const target = `http://${req.headers.host}${req.url}`
        // logger.info('received request for %s%s', req.headers.host, req.url)

        /**
         * once we've loaded the page just stream assets
         */
        if (!req.url.match(/\.(html|php)/) || req.method.toLowerCase() !== 'get') {
            return request(target).pipe(res)
        }

        /**
         * request HbbTV app
         */
        request.get({ uri: target, resolveWithFullResponse: true }).then((response) => {
            /**
             * propagate headers
             */
            for (let [key, value] of toPairs(response.headers)) {
                res.set(key, value)
            }

            let script = fs.readFileSync(path.resolve(__dirname, 'driver', 'driver.js'))
            script = script.toString().replace('"use strict";', '')
            script = script.replace('var getter = module && module.__esModule ?', 'var getter = false ?')

            logger.debug(`inject frontend driver script in ${target}`)
            response.body = response.body.replace('</head>', `
                <script src="http://192.168.1.7:8080/socket.io/socket.io.js"></script>
                <script type="text/javascript">
                    window.socket = window.io();
                    window.onerror = function (errorMsg, url, lineNumber) {
                        socket.emit('error:window', {
                           errorMsg: errorMsg,
                           url: url,
                           lineNumber: lineNumber
                        })
                    };
                </script>
                <script type="text/javascript">${script}</script>
                </head>
            `)
            console.log(response.body)
            // response.body += `<script type="text/javascript">${script}</script>`
            res.send(response.body)
        }, (e) => logger.errorAndThrow(e))
    }

    isConnected () {
        return Boolean(this.socket)
    }

    close () {
        logger.debug('stop proxy server')
        this.server.close()
    }
}
