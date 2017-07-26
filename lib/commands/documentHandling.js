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
    return JSON.stringify(args.map((arg) => {
        if (typeof arg === 'function') {
            return arg.toString()
        } else if (typeof arg === 'string') {
            return `"${arg}"`
        }

        return arg
    }))
}

/**
 * transform result of
 */
helpers.transformResult = async function (result) {
    /**
     * if result is a node, transform it into an element object
     */
    if (result.objectId && result.subtype === 'node') {
        return await this.request('Webdriver.transformElementObject', {
            objectId: result.objectId
        })
    }

    if (result.objectId) {
        const props = await this.request('Runtime.getProperties', { objectId: result.objectId })
        const returnValue = {}

        for (const prop of props.result) {
            returnValue[prop.name] = await helpers.transformResult.call(this, prop.value)
        }

        if (result.subtype === 'array') {
            return Object.values(returnValue)
        }

        return returnValue
    }

    return result.value
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
    const argsTransformed = helpers.transformExecuteArgs(args)
    const { result } = await this.request('Runtime.evaluate', {
        awaitPromise: false,
        expression: `(function () { ${script} }).apply(window, ${argsTransformed})`,
        generatePreview: true,
        includeCommandLineAPI: true,
        objectGroup: 'console',
        returnByValue: false,
        silent: false,
        userGesture: true
    })

    return await helpers.transformResult.call(this, result)
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
