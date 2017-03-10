/**
 * Helper for NamedNodeMap to easily iterate over their values
 */
window.NamedNodeMap.prototype.toArray = function () {
    const returnValue = []
    for (let i = 0; i < this.length; ++i) {
        returnValue.push({ name: this[i].name, value: this[i].nodeValue })
    }
    return returnValue
}

const flatten = arr => arr.reduce(
    (acc, val) => acc.concat(
        Array.isArray(val) ? flatten(val) : val
    ),
    []
)

export default function getAttributes (namedNodeMap) {
    const attributes = namedNodeMap.toArray().map((attr) => [attr.name, attr.value])
    return flatten(attributes)
}
