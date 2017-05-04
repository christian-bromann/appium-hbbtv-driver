let commands = {}
let helpers = {}
let extensions = {}

helpers.findElOrEls = async function (using, value, mult, elementId) {
    const ext = mult ? 's' : ''
    const fromElement = typeof elementId === 'string' ? 'FromElement' : ''
    return await this.request('Webdriver.findElement' + ext + fromElement, { using, value, elementId })
}

Object.assign(extensions, commands, helpers)
export { commands, helpers }
export default extensions
