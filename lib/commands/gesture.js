import { errors } from 'appium-base-driver'

let commands = {}

commands.click = async function (elementId) {
    if (this.isEmulator()) {
        return await this.request('click', { elementId }, false)
    }

    throw new errors.NotYetImplementedError()
}

export default commands
