import FrontendService from './service'

export default class DebuggerService extends FrontendService {
    constructor (io) {
        super(io, 'debugger', 'DebuggerService')
    }

    registerListeners (socket) {
        super.connect(socket)
    }
}
