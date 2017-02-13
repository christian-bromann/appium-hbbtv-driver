import domains from './domains'

const SUPPORTED_DOMAINS = Object.keys(domains)

/**
 * Pure implementation of the Chrome Remote Debugger Protocol (tip-of-tree) in JavaScript
 */
export default class RemoteDebugger {
    constructor (requestId) {
        this.requestId = requestId
        this.socket = window.io('/debugger')
        this.socket.emit('connection', {
            status: 'established',
            supportedDomains: SUPPORTED_DOMAINS
        })

        for (let [name, domain] of Object.entries(domains)) {
            this.socket.on(name, (args) => this.dispatchEvent(domain, args))
        }
    }

    dispatchEvent (target, args) {
        this.socket.emit('debug', 'received: ' + JSON.stringify(args))

        let result
        const method = target[args.method]

        if (!method) {
            return this.socket.emit('result', {
                id: args.id,
                error: `Method "${args.method}" not found`
            })
        }

        try {
            result = method.call(this, args.params)
        } catch (e) {
            this.socket.emit('debug', { message: e.message, stack: e.stack })
            return
        }

        if (!result) {
            this.socket.emit('debug', `no result for method "${method.name}"`)
            return
        }

        this.socket.emit('result', {
            id: args.id,
            result,
            _method: args.method,
            _domain: args.domain
        })
    }

    execute (method, params) {
        this.socket.emit('result', { method, params })
    }
}
