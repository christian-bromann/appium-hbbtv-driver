let commands = {}
let helpers = {}
let extensions = {}

commands.elementSelected = async function (elementId) {
    return await this.request('isElementSelected', { elementId })
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
    return await this.request('Webdriver.getText', { nodeId })
}

commands.getName = async function (elementId) {
    return await this.request('getElementTagName', { elementId })
}

commands.getSize = async function (elementId) {
    return await this.request('getElementRect', { elementId })
}

commands.getLocation = async function (elementId) {
    return await this.request('getElementRect', { elementId })
}

commands.elementEnabled = async function (elementId) {
    return await this.request('isElementEnabled', { elementId })
}

Object.assign(extensions, commands, helpers)
export { commands, helpers }
export default commands
