import io from 'socket.io'
import toPairs from 'lodash.topairs'
import express from 'express'
import request from 'request-promise-native'
import logger from './logger'

const SOCKET_CONNECTION_TIMEOUT = 30000

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
    }

    proxy (req, res) {
        const target = `http://${req.headers.host}${req.url}`
        logger.info('received request for %s%s', req.headers.host, req.url)

        /**
         * once we've loaded the page just stream assets
         */
        if (!req.url.match(/\.(html|php)/)) {
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

            response.body += '<script src="/socket.io/socket.io.js"></script>'
            response.body += '<script src="/driver.js"></script>'
            res.send(response.body)
        }, (e) => logger.errorAndThrow(e))
    }

    async connect () {
        logger.debug('Trying to connect to frontend driver ...')
        const socket = await new Promise((resolve, reject) => {
            this.io.on('connection', resolve)
            setTimeout(reject, SOCKET_CONNECTION_TIMEOUT)
        })

        logger.debug('Connected to frontend driver')
        return socket
    }

    close () {
        logger.debug('stop proxy server')
        this.server.close()
    }
}
