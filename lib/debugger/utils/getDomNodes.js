export default function getDomNodes (root, depth, pierce) {
    for (let i = 0; i < root.node.childNodes.length; ++i) {
        const node = root.node.childNodes[i]
        const child = root.addChild(node)

        if (depth && node.childNodes.length) {
            getDomNodes(child, depth - 1, pierce)
        }
    }
}
