let commands = {}

commands.getPageSource = async function () {
    return await this.request('getSource')
}

export default commands
