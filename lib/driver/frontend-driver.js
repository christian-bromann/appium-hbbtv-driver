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

    onload () {
        this.socket.emit('windowLoaded', null)
    }
}
