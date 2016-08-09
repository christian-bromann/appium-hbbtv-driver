import getSource from './commands/getSource'

export default class HbbTVFrontendDriver {
    constructor () {
        this.socket = window.io()

        /**
         * register command handler
         */
        this.socket.on('getSource', getSource.bind(this))
    }

    onload () {
        this.socket.emit('windowLoaded', null)
        document.write('I am ready!')
    }
}
