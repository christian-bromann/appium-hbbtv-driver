import Node from '../models/Node'
import getDomNodes from '../utils/getDomNodes'
import getColorFormatted from '../utils/getColorFormatted'

let enabled = false
const name = 'DOM'
const HIGHLIGHT_NODE_ID = '_highlightedNode'

/**
 * Returns the root DOM node (and optionally the subtree) to the caller.
 *
 * @param  {integer} depth   The maximum depth at which children should be retrieved, defaults to 1.
 *                           Use -1 for the entire subtree or provide an integer larger than 0.
 *                           (experimental)
 * @param  {boolean} pierce  Whether or not iframes and shadow roots should be traversed when returning
 *                           the subtree (default is false). (experimental)
 * @return {root}            Resulting node.
 */
export function getDocument ({ depth = 1, pierce }) {
    const root = new Node(document)
    getDomNodes(root, depth, pierce)
    return { root }
}

/**
 * Requests that children of the node with given id are returned to the caller in form of setChildNodes
 * events where not only immediate children are retrieved, but all children down to the specified depth.
 *
 * @param  {NodeId} nodeId   Id of the node to get children for.
 * @param  {integer} depth   The maximum depth at which children should be retrieved, defaults to 1.
 *                           Use -1 for the entire subtree or provide an integer larger than 0.
 *                           (experimental)
 * @param  {boolean} pierce  Whether or not iframes and shadow roots should be traversed when returning
 *                           the subtree (default is false). (experimental)
 */
export function requestChildNodes ({ nodeId, depth = 1, pierce }) {
    const root = Node.getNode(nodeId)

    if (!root) {
        throw new Error(`Couldn't find node with nodeId ${nodeId}`)
    }

    getDomNodes(root, depth, pierce)
    this.execute('DOM.setChildNodes', {
        parentId: nodeId,
        nodes: root.children
    })

    return {}
}

/**
 * Returns node's HTML markup.
 * @param  {NodeId} nodeId  Id of the node to get markup for.
 * @return {String}         Outer HTML markup.
 */
export function getOuterHTML ({ nodeId }) {
    const node = Node.getNode(nodeId)

    if (!node) {
        return {}
    }

    const elem = node.node
    return elem.outerHTML
}

/**
 * Sets node HTML markup, returns new node id.
 * @param {NodeId} nodeId    Id of the node to set markup for.
 * @param {String} outerHTML Outer HTML markup to set.
 */
export function setOuterHTML ({ nodeId, outerHTML }) {
    const node = Node.getNode(nodeId)

    if (!node) {
        return {}
    }

    const elem = node.node
    elem.outerHTML = outerHTML
    return {}
}

/**
 * Removes node with given id.
 * @param  {NodeId} nodeId  Id of the node to remove.
 */
export function removeNode ({ nodeId }) {
    const node = Node.getNode(nodeId)

    if (!node) {
        return {}
    }

    const elem = node.node
    elem.remove()

    return {}
}

/**
 * Hides DOM node highlight.
 */
export function hideHighlight () {
    const highlightNode = document.getElementById(HIGHLIGHT_NODE_ID)

    if (highlightNode) {
        highlightNode.remove()
    }

    return {}
}

/**
 * Highlights DOM node with given id or with the given JavaScript object wrapper. Either nodeId or objectId must be specified.
 *
 * @param  {highlightConfig}        highlightConfig  A descriptor for the highlight appearance.
 * @param  {NodeId}                 nodeId           Identifier of the node to highlight.
 */
export function highlightNode ({ highlightConfig, nodeId }) {
    const node = Node.getNode(nodeId).node

    /**
     * remove highlighted node if existing
     */
    hideHighlight()

    /**
     * check if node is visible
     */
    if (!(node.offsetWidth || node.offsetHeight)) {
        return {}
    }

    const computedStyle = window.getComputedStyle(node)
    const {
        contentColor,
        paddingColor,
        marginColor
    } = highlightConfig

    /**
     * node to highlight element
     */
    const elemNode = document.createElement('div')
    elemNode.style.backgroundColor = getColorFormatted(contentColor)
    elemNode.style.width = computedStyle.width
    elemNode.style.height = computedStyle.height

    /**
     * node to highlight padding
     */
    const paddingNode = document.createElement('div')
    paddingNode.style.borderColor = getColorFormatted(paddingColor)
    paddingNode.style.borderStyle = 'solid'
    paddingNode.style.borderWidth = `${computedStyle.paddingTop} ${computedStyle.paddingRight} ${computedStyle.paddingLeft} ${computedStyle.paddingBottom}`
    paddingNode.appendChild(elemNode)

    /**
     * node to highlight margin
     */
    const marginNode = document.createElement('div')
    marginNode.style.borderColor = getColorFormatted(marginColor)
    marginNode.style.borderStyle = 'solid'
    marginNode.style.borderWidth = `${computedStyle.marginTop} ${computedStyle.marginRight} ${computedStyle.marginLeft} ${computedStyle.marginBottom}`
    marginNode.appendChild(paddingNode)
    marginNode.id = HIGHLIGHT_NODE_ID

    /**
     * set position styles
     */
    marginNode.style.position = 'absolute'
    marginNode.style.left = computedStyle.left
    marginNode.style.right = computedStyle.right

    /**
     * attach margin node to body
     */
    document.body.appendChild(marginNode)
    return {}
}

/**
 * Enables console to refer to the node with given id via $x (see Command Line API for more
 * details $x functions).
 * ToDo: NYI
 *
 * @param  {NodeId} nodeId   DOM node id to be accessible by means of $x command line API.
 */
export function setInspectedNode () {
    return {}
}

/**
 * Sets attributes on element with given id. This method is useful when user edits some existing attribute
 * value and types in several attribute name/value pairs.
 *
 * @param {NodeId} nodeId  Id of the element to set attributes for.
 * @param {String} name    Text with a number of attributes. Will parse this text using HTML parser.
 * @param {String} text    Attribute name to replace with new attributes derived from text in case text
 *                         parsed successfully.
 */
export function setAttributesAsText ({ nodeId, name, text }) {
    const root = Node.getNode(nodeId)

    if (!root) {
        throw new Error(`Couldn't find node with nodeId ${nodeId}`)
    }

    /**
     * text format is: `class="className1 className2 newClassName"`
     */
    const value = text.slice(name.length + 2, -1)
    root.node.setAttribute(name, value)
    this.execute('DOM.attributeModified', { nodeId, name, value })
    return {}
}

/**
 * Marks last undoable state. (EXPERIMENTAL)
 */
export function markUndoableState () {
    return {}
}

export { enabled, name }
