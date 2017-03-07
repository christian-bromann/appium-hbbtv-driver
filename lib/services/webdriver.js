import FrontendService from './service'
import { readConfig } from '../utils'

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
        this.socket.on('connection', (msg) => {
            this.log.info(`frontend driver connection: ${msg.status}`)

            const { autoload, whitelist } = readConfig().data
            const cues = typeof whitelist === 'string' ? whitelist.split(',').map((f) => f.trim()) : []
            if (autoload && !cues.find(cue => msg.url.indexOf(cue) > -1)) {
                this.socket.emit('go', { url: autoload })
            }
        })
        this.socket.on('debug', (msg) => this.log.debug(msg))
    }
}
