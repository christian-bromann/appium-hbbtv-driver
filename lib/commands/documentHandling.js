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
 *
 * @param {Object} result  result object
 * @param {Number} depth   object depth to transform
 */
helpers.transformResult = async function (result, depth = 3) {
    if (depth < 0) {
        return '[Object]'
    }

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
            returnValue[prop.name] = await helpers.transformResult.call(this, prop.value, depth - 1)
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
helpers.transformExecuteScript = function (script, args) {
    const argsTransformed = helpers.transformExecuteArgs(args)
    return `(function () { ${script} }).apply(window, ${argsTransformed})`
}

/*
 * transform function into string
 */
helpers.transformExecuteAsyncScript = function (script, args) {
    const argsTransformed = helpers.transformExecuteArgs(args)
    return `(
        function () {
            var args = [].slice.apply(arguments || []);
            return new Promise(function (resolve, reject) {
                var result;

                args.push(function (result) {
                    if (result instanceof Error) {
                        return reject(result);
                    }

                    return resolve(result);
                })

                try {
                    (function () { ${script} }).apply(window, args);
                } catch (e) {
                    return reject(e);
                }
            })
        }
    ).apply(window, ${argsTransformed})`
}

commands.getPageSource = async function () {
    const result = await find.findElOrEls.call(this, 'css selector', 'html')
    const { outerHTML } = await this.request('DOM.getOuterHTML', { nodeId: result[W3C_ELEMENT_ID] })
    return outerHTML
}

commands.execute = async function (script, args) {
    const { result } = await this.request('Runtime.evaluate', {
        awaitPromise: false,
        expression: helpers.transformExecuteScript(script, args),
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
    const promise = await this.request('Runtime.evaluate', {
        awaitPromise: true,
        expression: helpers.transformExecuteAsyncScript(script, args),
        generatePreview: true,
        includeCommandLineAPI: true,
        objectGroup: 'console',
        returnByValue: false,
        silent: false,
        userGesture: true
    })

    const { result } = await this.request('Runtime.awaitPromise', {
        promiseObjectId: promise.result.objectId,
        returnByValue: false,
        generatePreview: true
    })

    return await helpers.transformResult.call(this, result)
}

Object.assign(extensions, commands, helpers)
export { commands, helpers }
export default commands
