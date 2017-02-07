import { Dom } from './domains'

/**
 * Pure implementation of the Chrome Remote Debugger Protocol (tip-of-tree) in JavaScript
 */
export default class RemoteDebugger {
    constructor () {
        this.socket = window.io('/debugger')
        this.socket.emit('connection', 'established')

        this.socket.on('DOM', (args) => this.dispatchEvent(Dom, args))
    }

    dispatchEvent (target, args) {
        const method = target[args.method]
        if (!method) {
            return
        }

        const result = method.apply(this, args.params)

        if (!result) {
            return
        }

        this.socket.emit('result', {
            id: args.id,
            result
        })
    }
}
