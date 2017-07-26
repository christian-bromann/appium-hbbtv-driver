let commands = {}
let helpers = {}
let extensions = {}

const FIND_ELEMENT_INTERVAL = 100

helpers.findElOrEls = async function (using, value, mult, elementId) {
    const ext = mult ? 's' : ''
    const fromElement = typeof elementId === 'string' ? 'FromElement' : ''
    const command = 'Webdriver.findElement' + ext + fromElement

    let result
    let elementFound = false
    let timeout = this.implicitWaitMs
    while (!elementFound && timeout > 0) {
        try {
            result = await this.request(command, { using, value, elementId })
            elementFound = true
        } catch (e) {
            result = e
            timeout -= FIND_ELEMENT_INTERVAL
            await new Promise((resolve) => setTimeout(resolve, FIND_ELEMENT_INTERVAL))
        }
    }

    if (result instanceof Error) {
        throw result
    }

    return result
}

Object.assign(extensions, commands, helpers)
export { commands, helpers }
export default extensions
