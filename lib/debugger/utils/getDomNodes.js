export default function getDomNodes (root, depth, pierce) {
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
        }
    }
}
