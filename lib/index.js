import yargs from 'yargs'
import HbbTVDriver from './driver'
import logger from './logger'
import { startServer } from './server'

const DEFAULT_HOST = '0.0.0.0'
const DEFAULT_PORT = 4723

const log = logger('Main')

async function main () {
    let port = yargs.argv.port || DEFAULT_PORT
    let host = yargs.argv.host || DEFAULT_HOST
    return startServer(port, host)
}

if (require.main === module) {
    main().catch((err) => {
        log.error(err.stack)
    })
}

export default HbbTVDriver
