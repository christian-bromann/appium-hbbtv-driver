import { errors } from 'appium-base-driver'

let commands = {}

commands.setUrl = async function (url) {
    if (this.isEmulator()) {
        return await this.emulator.sendCmd('open', { url })
    }

    throw new errors.NotYetImplementedError()
}

commands.backward = async function (url) {
    if (this.isEmulator()) {
        return await this.emulator.sendCmd('backward')
    }

    throw new errors.NotYetImplementedError()
}

commands.forward = async function (url) {
    if (this.isEmulator()) {
        return await this.emulator.sendCmd('forward')
    }

    throw new errors.NotYetImplementedError()
}
export default commands
