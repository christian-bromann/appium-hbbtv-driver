import ElementHandler from './element-handler'

export default class HbbTVFrontendDriver {
    constructor () {
        this.socket = window.io()
        this.elementHandler = new ElementHandler()

        /**
         * register command handler
         */
        this.socket.on('getSource', ::this.getSource)

        this.socket.on('findElement', ::this.findElement)
        this.socket.on('findElements', ::this.findElements)
        this.socket.on('findElementFromElement', ::this.findElement)
        this.socket.on('findElementsFromElement', ::this.findElements)

        this.socket.on('execute', ::this.execute)
        this.socket.on('executeAsync', ::this.executeAsync)

        this.socket.on('click', ::this.click)
    }

    getSource ({ sessionId }) {
        this.socket.emit('getSource', {
            sessionId,
            value: document.documentElement.outerHTML
        })
    }

    findElement (data) {
        const { uuid } = this.elementHandler.find(data)[0]
        this.socket.emit('findElement', {
            sessionId: data.sessionId,
            value: uuid
        })
    }

    findElements (data) {
        const elements = this.elementHandler.find(data)
        this.socket.emit('findElements', {
            sessionId: data.sessionId,
            value: elements.map((e) => e.uuid)
        })
    }

    findElementFromElement (data) {
        const nodeContext = this.elementHandler.get(data.elementId)
        const { uuid } = this.elementHandler.find(data, nodeContext)[0]
        this.socket.emit('findElementFromElement', {
            sessionId: data.sessionId,
            value: uuid
        })
    }

    findElementsFromElement (data) {
        const nodeContext = this.elementHandler.get(data.elementId)
        const elements = this.elementHandler.find(data, nodeContext)
        this.socket.emit('findElementFromElement', {
            sessionId: data.sessionId,
            value: elements.map((e) => e.uuid)
        })
    }

    execute ({script, args, sessionId}) {
        let value
        try {
            value = eval(`(function () { ${script} }).apply(null, [${args.join(', ')}])`) // eslint-disable-line no-eval
        } catch (error) {
            return this.socket.emit('execute', { sessionId, error })
        }

        this.socket.emit('execute', { sessionId, value })
    }

    executeAsync ({script, args, sessionId}) {
        window._asyncCallback = (value) => {
            this.socket.emit('executeAsync', { sessionId, value })
        }
        args.push(window._asyncCallback)

        try {
            eval(`(function () { ${script} }).apply(null, [${args.join(', ')}, window._asyncCallback])`)  // eslint-disable-line no-eval
        } catch (error) {
            return this.socket.emit('executeAsync', { sessionId, error })
        }
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

    onload () {
        this.socket.emit('windowLoaded', null)
    }
}
