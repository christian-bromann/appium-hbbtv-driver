let commands = {}
let helpers = {}
let extensions = {}

commands.getCookies = async function (sessionId) {
    return await this.request('Network.getCookies', {})
}

commands.setCookie = async function (cookie, sessionId) {
    return await this.request('Network.setCookie', cookie)
}

commands.deleteCookies = async function () {
    return await this.request('Network.clearBrowserCookies')
}

commands.deleteCookie = async function (cookieName) {
    return await this.request('Network.deleteCookie', { cookieName })
}

Object.assign(extensions, commands, helpers)
export { commands, helpers }
export default extensions
