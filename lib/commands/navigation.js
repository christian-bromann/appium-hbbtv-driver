import { PAGE_LOAD_TIMEOUT } from '../driver'

/**
 * helper
 */
async function pageloadRequest (command, params, expectedResponse) {
    this.request(command, params, false)

    /**
     * wait til page has loaded
     */
    let listener
    await new Promise((resolve, reject) => {
        listener = (result) => {
            if (result.method === expectedResponse) {
                resolve()
            }
            setTimeout(() => reject(new Error('page load timeout')), PAGE_LOAD_TIMEOUT)
        }
        this.emitter.on('stream', listener)
    })

    this.emitter.removeListener('stream', listener)
}

let commands = {}

commands.setUrl = async function (url) {
    await pageloadRequest.call(this,
        'Page.navigate',
        { url },
        'Runtime.executionContextCreated'
    )
    await new Promise((resolve) => setTimeout(resolve, 500))
}

commands.getUrl = async function () {
    const info = await this.request('Webdriver.info', {})
    return info.url
}

commands.back = async function () {
    await pageloadRequest.call(this,
        'Page.navigateToHistoryEntry',
        { entryId: -1 },
        'Runtime.executionContextCreated'
    )
}

commands.forward = async function () {
    await pageloadRequest.call(this,
        'Page.navigateToHistoryEntry',
        { entryId: +1 },
        'Runtime.executionContextCreated'
    )
}

commands.refresh = async function (url) {
    await pageloadRequest.call(this,
        'Page.reload',
        {},
        'Runtime.executionContextCreated'
    )
}

commands.title = async function (url) {
    const result = await this.request('Webdriver.title', {})
    return result.value
}

export default commands
