let commands = {}

commands.getPageSource = async function () {
    return await this.request('getPageSource')
}

export default commands
