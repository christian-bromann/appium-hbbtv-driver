let commands = {}

commands.click = async function (elementId) {
    return await this.request('click', { elementId }, false)
}

export default commands
