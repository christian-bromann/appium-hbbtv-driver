let commands = {}

commands.getSource = async function () {
    return await this.request('getSource')
}

export default commands
