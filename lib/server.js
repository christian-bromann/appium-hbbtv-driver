import ejs from 'ejs'
import request from 'request'
import { server as baseServer, routeConfiguringFunction } from 'appium-base-driver'

import { getDeviceConfig, writeConfig, isAlreadyRegistered, readConfig } from './utils'
import logger from './logger'
import HbbTVDriver from './driver'

const FAVICON_PATH = 'http://appium.io/ico/favicon.png'
const log = logger()

async function getNodeConfig (req, res) {
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

async function getSettings (req, res) {
    let proxyConfig = readConfig()
    const { host, port } = proxyConfig.data
    proxyConfig.error = null

    if (host && port) {
        proxyConfig.data.isAlreadyRegistered = await isAlreadyRegistered(host, port, this.devtools.proxy.uuid)
    }

    res.render('settings.html', proxyConfig)
}

async function postSettings (req, res) {
    const { host, port } = req.body
    log.info('Write config to file:', req.body)
    writeConfig(req.body)

    /**
     * register node if settings were given
     */
    if (host && port && !(await isAlreadyRegistered(host, port, this.devtools.proxy.uuid))) {
        return await registerNode.call(this, req.body, res)
    }

    return res.redirect('/settings')
}

async function registerNode (body, res) {
    const { host, port } = body
    let deviceConfig

    try {
        deviceConfig = await getDeviceConfig(body)
        deviceConfig.configuration.id = this.devtools.proxy.uuid
    } catch (e) {
        return res.status(403).json({
            message: 'Device not found or could not be detected',
            error: e.message
        })
    }

    try {
        log.info('Trying to register to grid with config', deviceConfig)
        await new Promise((resolve, reject) => request({
            url: `http://${host}:${port}/grid/register`,
            method: 'POST',
            body: deviceConfig,
            json: true,
            resolveWithFullResponse: true
        }, (err, body, res) => {
            if (err) {
                return reject(err)
            }

            resolve()
        }))
    } catch (e) {
        log.error(`Could not register to hub: ${e.message}`)
        return res.render('settings.html', { error: e.message, data: {} })
    }

    log.info(`Successfully registered to Selenium hub at ${host}:${port}`)
    return res.redirect('/settings')
}

async function startServer (port, host) {
    const driver = new HbbTVDriver()
    const router = routeConfiguringFunction(driver)
    const server = baseServer((app) => {
        /**
         * register driver specific endpoints to backend server
         */
        app.set('view engine', 'ejs')
        app.engine('html', ejs.renderFile)
        app.get('/favicon.ico', (req, res) => res.redirect(302, FAVICON_PATH))
        app.get('/nodeconfig.json', getNodeConfig.bind(driver))
        app.get('/settings', getSettings.bind(driver))
        app.post('/settings', postSettings.bind(driver))
        app.post('/register', registerNode.bind(driver))

        return router(app)
    }, port, host)

    log.info(`HbbTVDriver server listening on http://${host}:${port}`)
    return server
}

export { startServer }
