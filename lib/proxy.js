import path from 'path'
import toPairs from 'lodash.topairs'
import express from 'express'
import request from 'request-promise-native'
import logger from '../logger'
import io from 'socket.io'

export default class AppProxy {
    constructor (port = 43100) {
        this.port = port
        this.app = express()
        this.app.get('/driver.js', (_, res) => res.sendFile(path.join(__dirname, '..', 'driver', 'driver.js')))
        this.app.all('*', ::this.proxy)
        this.server = this.app.listen(port, () => logger.debug('Started proxy server'))
        io(this.server)
    }

    proxy (req, res) {
        let target = req.query.target

        /**
         * once we've loaded the page just stream assets
         */
        if (!target) {
            target = this.target + req.url
            return request(target).pipe(res)
        }

        /**
         * set baseurl for page assets to load
         */
        if (!this.target) {
            this.target = target
        }

        /**
         * request HbbTV app
         */
        request.get({ uri: target, resolveWithFullResponse: true }).then((response, aa) => {
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

    close () {
        logger.debug('stop proxy server')
        this.server.close()
    }
}
