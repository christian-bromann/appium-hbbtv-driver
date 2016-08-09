import { errors } from 'appium-base-driver'

let commands = {}

commands.setUrl = async function (url) {
    if (this.isEmulator()) {
        const res = await this.emulator.sendCmd('open', { url: `http://10.0.2.2:${this.proxy.port}?target=${url}` })
        this.socket = await this.proxy.connect()
        return res
    }

    throw new errors.NotYetImplementedError()
}

commands.backward = async function (url) {
    if (this.isEmulator()) {
        const res = await this.emulator.sendCmd('backward')
        this.socket = await this.proxy.connect()
        return res
    }

    throw new errors.NotYetImplementedError()
}

commands.forward = async function (url) {
    if (this.isEmulator()) {
        const res = await this.emulator.sendCmd('forward')
        this.socket = await this.proxy.connect()
        return res
    }

    throw new errors.NotYetImplementedError()
}
export default commands
