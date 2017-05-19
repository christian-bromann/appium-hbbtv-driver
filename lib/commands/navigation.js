import { PAGE_LOAD_TIMEOUT } from '../driver'
import { waitForEvent } from '../utils'

let commands = {}

commands.setUrl = async function (url) {
    this.request('Page.navigate', { url }, false)
    await waitForEvent(this.emitter, 'DOM.documentUpdated', PAGE_LOAD_TIMEOUT)

    /**
     * implicit pause for page to render
     */
    await new Promise((resolve) => setTimeout(resolve, 500))
}

commands.getUrl = async function () {
    const info = await this.request('Webdriver.info', {})
    return info.url
}

commands.back = async function () {
    this.request('Page.navigateToHistoryEntry', { entryId: -1 }, false)
    await waitForEvent(this.emitter, 'DOM.documentUpdated', PAGE_LOAD_TIMEOUT)

    /**
     * implicit pause for page to render
     */
    await new Promise((resolve) => setTimeout(resolve, 500))
}

commands.forward = async function () {
    this.request('Page.navigateToHistoryEntry', { entryId: +1 }, false)
    await waitForEvent(this.emitter, 'DOM.documentUpdated', PAGE_LOAD_TIMEOUT)

    /**
     * implicit pause for page to render
     */
    await new Promise((resolve) => setTimeout(resolve, 500))
}

commands.refresh = async function (url) {
    this.request('Page.reload', {}, false)
    await waitForEvent(this.emitter, 'DOM.documentUpdated', PAGE_LOAD_TIMEOUT)

    /**
     * implicit pause for page to render
     */
    await new Promise((resolve) => setTimeout(resolve, 500))
}

commands.title = async function (url) {
    const result = await this.request('Webdriver.title', {})
    return result.value
}

export default commands
