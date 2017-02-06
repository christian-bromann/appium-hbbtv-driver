let commands = {}
let helpers = {}
let extensions = {}

commands.elementSelected = async function (elementId) {
    return await this.request('isElementSelected', { elementId })
}

commands.getAttribute = async function (elementId) {
    return await this.request('getElementAttribute', { elementId })
}

commands.getCssProperty = async function (elementId) {
    return await this.request('getElementCSSValue', { elementId })
}

commands.getText = async function (elementId) {
    return await this.request('getElementText', { elementId })
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
