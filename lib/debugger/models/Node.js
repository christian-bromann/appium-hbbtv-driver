import getAttributes from '../utils/getAttributes'

let nodeCount = 0
let nodes = []
let elements = []

export default class Node {
    nodeId = nodeCount++

    constructor (node) {
        this.nodeId = nodes.length
        this.childNodeCount = node.childNodes.length
        this.localName = node.localName
        this.nodeName = node.nodeName
        this.nodeType = node.nodeType
        this.nodeValue = node.nodeValue

        if (node.attributes) {
            this.attributes = Array.prototype.slice.call(node.attributes)
                .map((item) => [item.nodeName, item.nodeValue])
                .reduce((list, item) => list.concat(item), [])
        }

        if (this.isDocumentNode()) {
            this.documentURL = node.documentURI
            this.xmlVersion = node.xmlVersion
            this.baseURL = node.baseURI
        }

        if (this.isDoctypeDeclaration()) {
            this.publicId = node.publicId
            this.systemId = node.systemId
        }

        /**
         * attach nodeId to DomNode
         */
        node._nodeId = this.nodeId

        /**
         * register mutation observer
         */
        this.observer = new MutationObserver((mutations) => {
            const attributeMutations = mutations.filter((m) => m.type === 'attributes')
            const childListMutations = mutations.filter((m) => m.type === 'childList')
            attributeMutations.forEach(::this.handleAttributeChange)
            childListMutations.forEach(::this.handleChildListMutations)
        })
        this.observer.observe(node, {
            attributes: true,
            attributeOldValue: true,
            childList: true
        })

        nodes.push(this)
        elements.push(node)
    }

    handleAttributeChange (mutation) {
        const attribute = mutation.target.attributes.getNamedItem(mutation.attributeName)
        const attributeValue = (attribute || {}).value

        /**
         * attribute modified
         */
        if (mutation.oldValue && attributeValue) {
            return window.remoteDebugger.execute('DOM.attributeModified', {
                nodeId: this.nodeId,
                name: mutation.attributeName,
                value: mutation.oldValue
            })
        }

        /**
         * attribute removed
         */
        if (mutation.oldValue && !attributeValue) {
            window.remoteDebugger.execute('DOM.attributeRemoved', {
                nodeId: this.nodeId,
                name: mutation.attributeName
            })
        }

        /**
         * attribute added
         */
        if (!mutation.oldValue) {
            window.remoteDebugger.execute('DOM.attributeModified', {
                nodeId: this.nodeId,
                name: mutation.attributeName,
                value: attributeValue
            })
        }
    }

    handleChildListMutations (mutation) {
        if (mutation.addedNodes.length) {
            for (let i = 0; i < mutation.addedNodes.length; ++i) {
                const node = new Node(mutation.addedNodes[i])
                window.remoteDebugger.execute('DOM.childNodeInserted', {
                    node: {
                        attributes: node.getFlattenedAttributes(),
                        childNodeCount: node.childNodeCount,
                        localName: node.localName,
                        nodeId: node.nodeId,
                        nodeName: node.nodeName,
                        nodeType: node.nodeType,
                        nodeValue: node.nodeValue
                    },
                    parentNodeId: this.nodeId,
                    previousNodeId: node.node.previousElementSibling._nodeId
                })
            }
        }

        if (mutation.removedNodes.length) {
            for (let i = 0; i < mutation.removedNodes.length; ++i) {
                const node = mutation.removedNodes[i]
                window.remoteDebugger.execute('DOM.childNodeRemoved', {
                    nodeId: node._nodeId,
                    parentNodeId: this.nodeId
                })
            }
        }
    }

    isDocumentNode () {
        return this.nodeName === '#document'
    }

    isDoctypeDeclaration () {
        return this.nodeName === 'html'
    }

    getFlattenedAttributes () {
        return getAttributes(this.node.attributes)
    }

    addChild (node) {
        if (!this.children) {
            this.children = []
        }

        const child = new Node(node)
        child.parentId = this.nodeId
        this.children.push(child)
        return child
    }

    get node () {
        return elements[this.nodeId]
    }

    static getNode (nodeId) {
        return nodes[nodeId]
    }
}
