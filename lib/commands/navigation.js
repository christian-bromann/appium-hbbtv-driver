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
        'Page.frameNavigated'
    )
}

commands.getUrl = async function () {
    const info = await this.request('Webdriver.info', {})
    return info.url
}

commands.back = async function () {
    await pageloadRequest.call(this,
        'Page.navigateToHistoryEntry',
        { entryId: -1 },
        'Page.frameNavigated'
    )
}

commands.forward = async function () {
    await pageloadRequest.call(this,
        'Page.navigateToHistoryEntry',
        { entryId: +1 },
        'Page.frameNavigated'
    )
}

commands.refresh = async function (url) {
    await pageloadRequest.call(this,
        'Page.reload',
        {},
        'Page.frameNavigated'
    )
}

commands.title = async function (url) {
    const info = await this.request('Webdriver.info', {})
    return info.title
}

export default commands
