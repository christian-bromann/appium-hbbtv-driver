let commands = {}
let helpers = {}
let extensions = {}

commands.keys = async function (value) {
    return await this.request('Input.dispatchKeyEvent', { value })
}

Object.assign(extensions, commands, helpers)
export { commands, helpers }
export default commands
