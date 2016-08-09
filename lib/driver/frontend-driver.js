export default class HbbTVFrontendDriver {
    constructor () {
        this.socket = window.io()
    }

    onload () {
        this.socket.emit('windowLoaded', null)
        document.write('I am ready!')
    }
}
