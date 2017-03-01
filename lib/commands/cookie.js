let commands = {}
let helpers = {}
let extensions = {}

commands.getCookies = async function (sessionId) {
    return await this.request('getAllCookies', {})
}

commands.setCookie = async function (cookie, sessionId) {
    return await this.request('addCookie', { cookie })
}

commands.deleteCookies = async function () {
    return await this.request('deleteAllCookies', {}, false)
}

commands.deleteCookie = async function (name) {
    return await this.request('deleteCookie', { name })
}

Object.assign(extensions, commands, helpers)
export { commands, helpers }
export default extensions
