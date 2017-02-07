let nodeCount = 0
let nodes = []

export default class Node {
    baseURL = this.node.baseURI
    childNodeCount = this.node.childNodes.length
    localName = this.node.localName
    nodeName = this.node.nodeName
    nodeType = this.node.nodeType
    nodeValue = this.node.nodeValue

    constructor (node) {
        this.node = node
        this.nodeId = ++nodeCount

        if (node.attributes) {
            this.attributes = Array.prototype.slice.call(node.attributes)
                .map((item) => [item.nodeName, item.nodeValue])
                .reduce((list, item) => list.concat(item), [])
        }

        if (this.isDocumentNode()) {
            this.documentURL = this.node.documentURI
            this.xmlVersion = this.node.xmlVersion
        }

        if (this.isDoctypeDeclaration()) {
            this.publicId = this.node.publicId
            this.systemId = this.node.systemId
        }

        nodes.push(this)
    }

    isDocumentNode () {
        return this.node.nodeName === '#document'
    }

    isDoctypeDeclaration () {
        return this.node.nodeName === 'html'
    }

    getAttributes () {
        return this
    }

    addChild (node) {
        if (!this.children) {
            this.children = []
        }

        node.parentId = this.nodeId
        this.children.push(node)
    }

    static getNode (nodeId) {
        return nodes.filter((node) => node.nodeId === nodeId)[0]
    }
}
