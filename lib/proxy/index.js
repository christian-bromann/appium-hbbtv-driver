import path from 'path'
import toPairs from 'lodash.topairs'
import express from 'express'
import request from 'request-promise-native'
import logger from '../logger'

export default class AppProxy {
    constructor (port = 43100) {
        this.port = port
        this.server = express()
        this.server.get('/driver.js', (_, res) => res.sendFile(path.join(__dirname, 'driver.js')))
        this.server.all('*', ::this.proxy)
        this.server.listen(port, () => logger.debug('Started proxy server'))
    }

    proxy (req, res) {
        let target = req.query.target

        /**
         * return 404 if requesting page assets without target set
         */
        if (!target && !this.target) {
            return res.sendStatus(404)
        }

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

            response.body += '<script src="/driver.js"></script>'
            res.send(response.body)
        }, (e) => logger.errorAndThrow(e))
    }
}
