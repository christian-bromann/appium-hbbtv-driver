import ElementHandler from './elementHandler'
import { getPageSource, execute, executeAsync } from './commands/documentHandling'
import {
    isElementSelected, getElementAttribute, getElementProperty, getElementCSSValue,
    getElementText, getElementTagName, getElementRect, isElementEnabled
} from './commands/elementState'
import { go, getCurrentURL, back, forward, refresh, getTitle } from './commands/navigation'
import { getAllCookies, getNamedCookies, addCookie, deleteAllCookies, deleteCookie } from './commands/cookies'
import { keys } from './commands/elementInteraction'

import { getDriverOrigin } from '../services/utils/frontend'
const origin = getDriverOrigin()

export default class HbbTVFrontendDriver {
    constructor () {
        this.socket = window.io(`${origin}/webdriver`)
        this.socket.emit('connection', {
            status: 'established',
            url: document.URL
        })

        this.elementHandler = new ElementHandler()

        /**
         * document handling
         */
        this.socket.on('getPageSource', getPageSource.bind(this))
        this.socket.on('execute', execute.bind(this))
        this.socket.on('executeAsync', executeAsync.bind(this))

        /**
         * element state commands
         */
        this.socket.on('isElementSelected', isElementSelected.bind(this))
        this.socket.on('getElementAttribute', getElementAttribute.bind(this))
        this.socket.on('getElementProperty', getElementProperty.bind(this))
        this.socket.on('getElementCSSValue', getElementCSSValue.bind(this))
        this.socket.on('getElementText', getElementText.bind(this))
        this.socket.on('getElementTagName', getElementTagName.bind(this))
        this.socket.on('getElementRect', getElementRect.bind(this))
        this.socket.on('isElementEnabled', isElementEnabled.bind(this))

        /**
         * navigation
         */
        this.socket.on('go', go.bind(this))
        this.socket.on('getCurrentURL', getCurrentURL.bind(this))
        this.socket.on('back', back.bind(this))
        this.socket.on('forward', forward.bind(this))
        this.socket.on('refresh', refresh.bind(this))
        this.socket.on('getTitle', getTitle.bind(this))

        /**
         * cookies
         */
        this.socket.on('getAllCookies', getAllCookies.bind(this))
        this.socket.on('getNamedCookies', getNamedCookies.bind(this))
        this.socket.on('addCookie', addCookie.bind(this))
        this.socket.on('deleteAllCookies', deleteAllCookies.bind(this))
        this.socket.on('deleteCookie', deleteCookie.bind(this))

        /**
         * element interaction
         */
        this.socket.on('keys', keys.bind(this))

        /**
         * element retrieval
         */
        this.socket.on('findElement', ::this.findElement)
        this.socket.on('findElements', ::this.findElements)
        this.socket.on('findElementFromElement', ::this.findElement)
        this.socket.on('findElementsFromElement', ::this.findElements)

        this.socket.on('click', ::this.click)
    }

    debug (...args) {
        this.socket.emit('debug', args)
    }

    findElement (data) {
        const elements = this.elementHandler.find(data)

        if (elements.length === 0) {
            return this.respond('findElement', { error: new Error('NoSuchElement') })
        }

        this.respond('findElement', elements[0])
    }

    findElements (data) {
        const elements = this.elementHandler.find(data)
        this.respond('findElements', elements)
    }

    findElementFromElement (data) {
        const nodeContext = this.elementHandler.get(data.elementId)
        const { uuid } = this.elementHandler.find(data, nodeContext)[0]
        this.respond('findElementFromElement', uuid)
    }

    findElementsFromElement (data) {
        const nodeContext = this.elementHandler.get(data.elementId)
        const elements = this.elementHandler.find(data, nodeContext)
        this.respond('findElementFromElement', elements.map((e) => e.uuid))
    }

    click (data) {
        const elem = this.elementHandler.get(data.elementId)
        this.triggerEvent('click', elem)
    }

    triggerEvent (eventName, nodeContext) {
        if (!(nodeContext instanceof HTMLElement)) {
            throw new Error('Can\'t trigger event on non HTMLElement')
        }

        const event = document.createEvent('Event')
        event.initEvent(eventName, true, true)
        nodeContext.dispatchEvent(event)
    }

    respond (cmd, result) {
        this.debug('respond with', `${cmd}Result`, result)
        this.socket.emit(`${cmd}Result`, result)
    }

    error (cmd, error, message) {
        this.debug(`Error: ${error}`)
        this.socket.emit(`${cmd}Result`, { error, message })
    }
}
