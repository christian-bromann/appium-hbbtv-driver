let commands = {}
let helpers = {}
let extensions = {}

commands.elementSelected = async function (nodeId) {
    const { value } = await this.request('Webdriver.getElementProperty', {
        nodeId,
        property: 'checked'
    })

    return Boolean(value)
}

commands.getAttribute = async function (attribute, nodeId) {
    const { attributes } = await this.request('DOM.getAttributes', { nodeId })
    const attrIndex = attributes.indexOf(attribute)

    if (attrIndex === -1) {
        return null
    }

    return attributes[attrIndex + 1]
}

commands.getCssProperty = async function (cssProperty, nodeId) {
    const { computedStyle } = await this.request('CSS.getComputedStyleForNode', { nodeId })
    const style = computedStyle.filter((cs) => cs.name === cssProperty)[0]
    return style.value
}

commands.getText = async function (nodeId) {
    const { text } = await this.request('Webdriver.getText', { nodeId })
    return text
}

commands.getName = async function (nodeId) {
    const { object } = await this.request('DOM.resolveNode', { nodeId })
    return object.description
}

commands.getSize = async function (nodeId) {
    return await this.request('Webdriver.getElementRect', { nodeId })
}

commands.getLocation = async function (nodeId) {
    return await this.request('Webdriver.getElementRect', { nodeId })
}

commands.elementEnabled = async function (nodeId) {
    const { value } = await this.request('Webdriver.getElementProperty', {
        nodeId,
        property: 'disabled'
    })

    return !value
}

/**
 * takes the computedStyle result of CSS.getComputedStyleForNode and transforms it into an
 * style object
 */
helpers.transformStyles = function (computedStyle) {
    const style = {}
    for (const { name, value } of computedStyle) {
        style[name] = value
    }
    return style
}

commands.elementDisplayed = async function (nodeId) {
    const { computedStyle } = await this.request('CSS.getComputedStyleForNode', { nodeId })
    const styles = helpers.transformStyles(computedStyle)
    return !(styles.display === 'none' || styles.visibility === 'hidden')
}

Object.assign(extensions, commands, helpers)
export { commands, helpers }
export default commands
