import find from './find'

let helpers = {}
let commands = {}
let extensions = {}

const W3C_ELEMENT_ID = 'element-6066-11e4-a52e-4f735466cecf'

/**
 * transforms functions and objects to string to get them over the socket wire
 */
helpers.transformExecuteArgs = function (args) {
    args = Array.isArray(args) ? args : [args]
    return args.map((arg) => {
        if (typeof arg === 'function') {
            return arg.toString()
        } else if (typeof arg === 'string') {
            return `"${arg}"`
        }

        return JSON.stringify(arg)
    })
}

/*
 * transform function into string
 */
helpers.transformExecuteScript = function (script) {
    if (typeof script === 'string') {
        return script
    }

    return `;return (${script}).apply(null, arguments || []);`
}

commands.getPageSource = async function () {
    const result = await find.findElOrEls.call(this, 'css selector', 'html')
    const { outerHTML } = await this.request('DOM.getOuterHTML', { nodeId: result[W3C_ELEMENT_ID] })
    return outerHTML
}

commands.execute = async function (script, args) {
    return await this.request('execute', {
        script: helpers.transformExecuteScript(script),
        args: helpers.transformExecuteArgs(args)
    })
}

commands.executeAsync = async function (script, args) {
    return await this.request('executeAsync', {
        script: helpers.transformExecuteScript(script),
        args: helpers.transformExecuteArgs(args)
    })
}

Object.assign(extensions, commands, helpers)
export { commands, helpers }
export default commands
