import Node from '../models/Node'
import getDomNodes from '../utils/getDomNodes'

let enabled = false
const name = 'DOM'

/**
 * Enables DOM agent for the given page.
 */
export function enable () {
    enabled = true
    return {}
}

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
export function getDocument (depth = 1, pierce) {
    const root = new Node(document)
    getDomNodes(root, depth, pierce)
    return root
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
export function requestChildNodes (nodeId, depth = 1, pierce) {
    const root = Node.getNode(nodeId)

    if (!root) {
        throw new Error(`Couldn't find node with nodeId ${nodeId}`)
    }

    getDomNodes(root, depth, pierce)
    this.socket.emit('setChildNodes', {
        parentId: nodeId,
        nodes: root.children
    })
}

/**
 * Hides DOM node highlight.
 * NYI
 */
export function hideHighlight () {
    return {}
}

export { enabled, name }
