import ejs from 'ejs'
import path from 'path'
import request from 'request'
import { EventEmitter } from 'events'

import WebSocket from 'ws'
import { BaseDriver } from 'appium-base-driver'
import toPairs from 'lodash.topairs'
import DevtoolsBackend from 'devtools-backend'

import OperaTVEmulator from './emulator'
import logger from './logger'
import commands from './commands'
import { limit, errors, getDeviceConfig, writeConfig, isAlreadyRegistered, readConfig, waitForEvent } from './utils'
import { desiredCapConstraints, desiredCapValidation } from './desired-caps'

const DRIVER_TIMEOUT = 10000
const SCRIPT_TIMEOUT = 30000
const IMPLICIT_WAIT_TIMEOUT = 30000
const PAGE_LOAD_TIMEOUT = 30000
const COMMAND_TIMEOUT = Math.max(SCRIPT_TIMEOUT, IMPLICIT_WAIT_TIMEOUT, PAGE_LOAD_TIMEOUT)
const FAVICON_PATH = 'http://appium.io/ico/favicon.png'

const SUPPORTED_LOCATOR_STRATEGIES = [
    'id',
    'xpath',
    'link text',
    'css selector',
    'partial link text'
]

class HbbTVDriver extends BaseDriver {
    constructor (opts, shouldValidateCaps) {
        super(opts, shouldValidateCaps)

        this.desiredCapConstraints = desiredCapConstraints
        this.locatorStrategies = SUPPORTED_LOCATOR_STRATEGIES
        this.log = logger(path.basename(__filename))
        this.emitter = new EventEmitter()
        this.commandId = 0
        this.reset()

        this.devtools = new DevtoolsBackend()

        /**
         * register driver specific endpoints to backend server
         */
        this.devtools.app.set('view engine', 'ejs')
        this.devtools.app.engine('html', ejs.renderFile)
        this.devtools.app.get('/favicon.ico', (req, res) => res.redirect(302, FAVICON_PATH))
        this.devtools.app.get('/nodeconfig.json', ::this.getNodeConfig)
        this.devtools.app.get('/settings', ::this.getSettings)
        this.devtools.app.post('/settings', ::this.postSettings)
        this.devtools.app.post('/register', ::this.registerNode)

        this.pageloadOngoing = false
    }

    /**
     * resets session
     */
    async reset () {
    }

    async resetEmulator () {
        await new Promise((resolve) => setTimeout(resolve, 1000)) // time to unlock vm
        await this.emulator.clearProfile()
    }

    /**
     * check with the base class, and return if it fails
     */
    validateDesiredCaps (caps) {
        super.validateDesiredCaps(caps)
        return desiredCapValidation(caps)
    }

    /**
     * start emulator or TV session
     */
    async start (caps, sessionId) {
        /**
         * run Opera TV emulator via VirtualBox
         */
        if (this.isEmulator()) {
            this.log.debug('Run Opera TV emulator session')
            return await this.startEmulator()
        }

        const remoteDebuggingPageUrl = await this.getPageUrl(caps, sessionId)
        this.log.info(`Trying to connect to remote debugging session at ${remoteDebuggingPageUrl}`)
        this.ws = new WebSocket(remoteDebuggingPageUrl, {
            perMessageDeflate: false
        })

        await new Promise((resolve, reject) => {
            this.ws.on('open', resolve)
            setTimeout(() => reject(new Error(
                `Couldn't connect to remote debugging page ${remoteDebuggingPageUrl}`)
            ), DRIVER_TIMEOUT)
        })

        this.log.info('Connected to remote debugging session')
        this.ws.on('message', (msg) => {
            const response = JSON.parse(msg)

            if (response.id) {
                this.log.debug('Received socket response', response.id, response.method)
                this.emitter.emit(response.id, response.result)
            }

            if (response.method === 'Runtime.executionContextDestroyed') {
                this.pageloadOngoing = true
            }

            if (response.method === 'DOM.documentUpdated') {
                this.pageloadOngoing = false
            }

            this.emitter.emit('stream', response)
        })

        /**
         * ToDo implement for real TV
         */
        return true
    }

    /**
     * start session
     */
    async createSession (caps) {
        let [ sessionId ] = await super.createSession(caps)
        this.sessionId = sessionId

        this.log.debug(`Start session ${this.sessionId}`)
        await this.start(caps, this.sessionId)

        return [this.sessionId, this.caps]
    }

    async deleteSession () {
        this.log.debug('Deleting HbbTV session')

        if (this.isEmulator()) {
            await this.emulator.powerOff()
            await this.resetEmulator()
        }

        await super.deleteSession()
        this.log.debug('Bye 👋 !')
    }

    /**
     * make request to frontend driver
     * @param  {String} cmd       command name
     * @param  {Object} [args={}] arguments for command
     * @return {Object}           result
     */
    async request (method, params = {}, expectResponse = true) {
        const id = ++this.commandId
        const command = JSON.stringify({ id, method, params })

        if (this.pageloadOngoing) {
            this.log.info('last command triggered page load, waiting until page has loaded')
            await waitForEvent(this.emitter, 'DOM.documentUpdated', PAGE_LOAD_TIMEOUT)
            this.log.info(`page loaded, continue with ${command}`)
        }

        if (!expectResponse) {
            this.log.debug(`Command: ${command}`)
            return this.ws.send(command)
        }

        return await new Promise((resolve, reject) => {
            setTimeout(reject, COMMAND_TIMEOUT)
            this.emitter.once(id, (data) => {
                if (data && typeof data.error === 'string') {
                    const error = errors[data.error] ? new errors[data.error](data.message) : new errors.UnknownError()
                    return reject(error)
                }

                this.log.debug(`Received result for ${method}: ${limit(data)}`)
                resolve(data)
            })

            this.log.debug(`Command: ${command}`)
            this.ws.send(command)
        })
    }

    /**
     * get page url based on capability settings
     */
    async getPageUrl (caps, sessionId) {
        /**
         * user runs devtools-backend on external server
         */
        if (caps.debuggerAddress) {
            return `ws://${caps.debuggerAddress}`
        }

        /**
         * user knows registered pages and wants to run on specific page
         */
        if (caps.pageId) {
            const pageList = this.devtools.backend.pages.map((page) => page.uuid)
            const page = pageList.find((uuid) => uuid === caps.pageId)
            if (!page) {
                this.log.errorAndThrow(
                    `Couldn't find page id ${caps.pageId}, registered pages are: ${pageList.join(', ')}`
                )
            }

            return `ws://localhost:9222/devtools/page/${caps.pageId}`
        }

        /**
         * no page id is defined but proxy already registered a page
         */
        if (this.devtools.proxy.page) {
            return `ws://localhost:9222/devtools/page/${this.devtools.proxy.page.uuid}`
        }

        /**
         * if nothing applies, try to connect to page
         * an user action is required here
         */
        this.devtools.proxy.uuid = sessionId
        this.log.info(
            'No automation script was injected yet, please restart your HbbTV app by pressing ' +
            'on the "EXIT" button to give the driver control over the page.'
        )

        return await new Promise((resolve, reject) => {
            let connectionTimeout
            const setIntervalId = setInterval(() => {
                this.log.info('checking for page connection, press "EXIT" on remote control ...')
                if (this.devtools.proxy.page) {
                    clearInterval(setIntervalId)
                    clearTimeout(connectionTimeout)
                    return resolve(`ws://localhost:9222/devtools/page/${this.devtools.proxy.page.uuid}`)
                }
            }, 500)

            connectionTimeout = setTimeout(() => {
                const err = new Error(`No connection to OTT device after ${DRIVER_TIMEOUT}ms .. aborting`)
                this.log.error(err)
                clearInterval(setIntervalId)
                clearTimeout(connectionTimeout)
                reject(err)
            }, DRIVER_TIMEOUT)
        })
    }

    /**
     * check if options define Opera TV Emulator as capability
     */
    isEmulator () {
        return !!this.opts.vdi
    }

    /**
     * run Opera TV emulator session
     */
    async startEmulator () {
        this.emulator = new OperaTVEmulator(this.opts)
        await this.emulator.initializeProfile(this.sessionId)
        await this.emulator.boot()
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

    async getSettings (req, res) {
        let proxyConfig = readConfig()
        const { host, port } = proxyConfig.data

        if (host && port) {
            proxyConfig.data.isAlreadyRegistered = await isAlreadyRegistered(host, port, this.uuid)
        }

        res.render('settings.html', proxyConfig)
    }

    async postSettings (req, res) {
        const { host, port } = req.body
        this.log.info('Write config to file:', req.body)
        writeConfig(req.body)

        /**
         * register node if settings were given
         */
        if (host && port && await isAlreadyRegistered(host, port, this.uuid)) {
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
}

for (let [cmd, fn] of toPairs(commands)) {
    HbbTVDriver.prototype[cmd] = fn
}

export default HbbTVDriver
export { SCRIPT_TIMEOUT, IMPLICIT_WAIT_TIMEOUT, PAGE_LOAD_TIMEOUT, SUPPORTED_LOCATOR_STRATEGIES, HbbTVDriver }
