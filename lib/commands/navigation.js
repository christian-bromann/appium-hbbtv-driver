let commands = {}

commands.setUrl = async function (url) {
    return await this.request('Page.navigate', { url })
}

commands.getUrl = async function () {
    return await this.request('getCurrentURL', {})
}

commands.backward = async function (url) {
    return await this.request('back', {}, false)
}

commands.forward = async function (url) {
    return await this.request('forward', {}, false)
}

commands.refresh = async function (url) {
    return await this.request('refresh', {}, false)
}

commands.title = async function (url) {
    return await this.request('getTitle', {})
}

export default commands
