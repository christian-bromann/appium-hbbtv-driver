let nodeCount = 0
let nodes = []
let elements = []

export default class Node {
    nodeId = nodeCount++

    constructor (node) {
        this.baseURL = node.baseURI
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
        }

        if (this.isDoctypeDeclaration()) {
            this.publicId = node.publicId
            this.systemId = node.systemId
        }

        nodes.push(this)
        elements.push(node)
    }

    isDocumentNode () {
        return this.nodeName === '#document'
    }

    isDoctypeDeclaration () {
        return this.nodeName === 'html'
    }

    getAttributes () {
        return this
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
        return nodes.filter((node) => node.nodeId === nodeId)[0]
    }
}
