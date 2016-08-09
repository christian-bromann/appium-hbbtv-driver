import { errors } from 'appium-base-driver'

let commands = {}

commands.getSource = async function () {
    if (this.isEmulator()) {
        return await this.request('getSource')
    }

    throw new errors.NotYetImplementedError()
}

export default commands
