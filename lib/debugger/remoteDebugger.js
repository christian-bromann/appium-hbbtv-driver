import domains from './domains'

/**
 * Pure implementation of the Chrome Remote Debugger Protocol (tip-of-tree) in JavaScript
 */
export default class RemoteDebugger {
    constructor () {
        this.socket = window.io('/debugger')
        this.socket.emit('connection', 'established')

        this.socket.on()
    }
}
