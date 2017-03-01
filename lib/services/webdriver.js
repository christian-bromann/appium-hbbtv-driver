import FrontendService from './service'

export default class WebdriverService extends FrontendService {
    constructor (io) {
        super(io, 'webdriver', 'WebdriverService')
    }

    connect (socket) {
        this.log.debug('Connected to smart TV')
        this.socket = socket

        /**
         * Todo: consolidate in channels
         */
        this.socket.on('error:window', (e) => this.log.error(e))
        this.socket.on('connection', (msg) => this.log.info(`frontend driver connection: ${msg}`))
        this.socket.on('debug', (msg) => this.log.debug(msg))
    }
}
