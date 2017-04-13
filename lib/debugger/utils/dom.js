/**
 * parses through root children to create Node objects
 * @param  {NodeElement} root   element to start with
 * @param  {number}      depth  number of child depth to parse through
 * @param  {Object}      pierce unknown
 * @return {Node}               root element with children elements
 */
export function getDomNodes (root, depth, pierce) {
    for (let i = 0; i < root.node.childNodes.length; ++i) {
        const node = root.node.childNodes[i]

        /**
         * ignore line break nodes
         */
        if (node.nodeName === '#text' && node.nodeValue.trim() === '') {
            continue
        }

        const child = root.addChild(node)

        if (depth && child && node.childNodes.length) {
            getDomNodes(child, depth - 1, pierce)
            continue
        }

        /**
         * get child node if it is only a text node
         */
        if (child && node.childNodes.length === 1 && node.childNodes[0].nodeName === '#text') {
            getDomNodes(child, 0, pierce)
        }
    }
}

let nodes = 0
export function setNodeIds (root) {
    if (!root) {
        return
    }

    root._nodeId = nodes++
    for (let i = 0; i < root.childNodes.length; ++i) {
        setNodeIds(root.childNodes[i])
    }
}

/**
 * parses rgba color object to css string
 * @param  {Object} color  object with r, g, b and a property
 * @return {string}        css value for e.g. background-color property
 */
export function getColorFormatted (color) {
    return `rgba(${color.r},${color.g},${color.b},${color.a})`
}
