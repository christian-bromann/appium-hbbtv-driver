import ejs from 'ejs'
import path from 'path'
import zipObject from 'lodash.zipobject'

import Router from './router'
import settings from './settings'
import Hub from './hub'

const VIEWS_PATH = path.resolve(__dirname, 'templates')
const FAVICON_PATH = 'http://appium.io/ico/favicon.png'
const USERAGENT_REGEX = /HbbTV\/(\d\.\d\.\d)\s\(([^;]*);([^;]*);([^;]*);([^;]*);([^;]*);([^)]*)\)/g
const DEFAULT_CAPABILITY_ENTRY = {
    platformName: '',
    platformVersion: ''
}

export default class DriverViews extends Router {
    constructor (app, driver) {
        super(app)
        this.driver = driver
        this.hub = new Hub()
        this.message = null

        app.set('view engine', 'ejs')
        app.set('views', VIEWS_PATH)
        app.engine('html', ejs.renderFile)
    }

    get routes () {
        return {
            'GET /favicon.ico': 'getFavicon',
            'GET /settings': 'getSettingsView',
            'POST /settings': 'postSettingsView',
            'GET /nodeconfig.json': 'getNodeConfigView'
        }
    }

    getFavicon (req, res) {
        return res.redirect(302, FAVICON_PATH)
    }

    async getSettingsView (req, res) {
        let { capabilities } = settings.read()
        const { host, port } = settings.read()
        const proxyPage = this.driver.devtools.proxy.page

        if (!capabilities && proxyPage) {
            capabilities = DriverViews.getCapabilitiesByUserAgent(proxyPage.metadata.userAgent)
        }

        /**
         * check if node is already registered
         */
        if (!this.hub.isRegistered && host && port && await Hub.findNode(host, port)) {
            this.hub.host = host
            this.hub.port = port
            this.hub.isRegistered = true
        }

        res.render('settings.html', {
            isRegistered: this.hub.isRegistered,
            capabilities: capabilities || DEFAULT_CAPABILITY_ENTRY,
            host,
            port,
            message: this.message
        })

        /**
         * clear message cache
         */
        this.message = null
    }

    async postSettingsView (req, res) {
        const proxyPage = this.driver.devtools.proxy.page
        let { host, port, capabilityName, capabilityValue } = req.body
        let capabilities = zipObject(capabilityName || [], capabilityValue || [])

        /**
         * clean empty capabilities
         */
        Object.keys(capabilities).forEach(
            (key) => (capabilities[key] === '') && delete capabilities[key]
        )

        if (Object.keys(capabilities).length === 0 && proxyPage) {
            capabilities = DriverViews.getCapabilitiesByUserAgent(proxyPage.metadata.userAgent)
        }

        /**
         * save new settings
         */
        const newConfig = { host, port, capabilities }
        settings.write(newConfig)

        /**
         * register node if settings were given and differ from current settings
         */
        if (host && port && (this.hub.host !== host || this.hub.port !== port)) {
            this.hub = new Hub(host, port)
            this.message = await this.hub.register(capabilities)

            /**
             * delete wrong hub data
             */
            host = undefined
            port = undefined
        }

        return res.redirect('/settings')
    }

    async getNodeConfigView (req, res) {
        let nodeConfig = this.hub.getConfig()
        return res.json(nodeConfig)
    }

    static getCapabilitiesByUserAgent (userAgent) {
        const match = USERAGENT_REGEX.exec(userAgent)

        if (!match) {
            return DEFAULT_CAPABILITY_ENTRY
        }

        const [
            platformVersion, platformFeatures, platformName, softwareVersion, hardwareVersion
        ] = match.slice(1)

        return { platformName, platformVersion, platformFeatures, softwareVersion, hardwareVersion }
    }

    static create (app, driver) {
        return new DriverViews(app, driver)
    }
}
