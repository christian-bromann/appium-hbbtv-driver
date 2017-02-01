import yargs from 'yargs'
import HbbTVDriver from './driver'
import { startServer } from './server'

const DEFAULT_HOST = 'localhost'
const DEFAULT_PORT = 4723

async function main () {
    let port = yargs.argv.port || DEFAULT_PORT
    let host = yargs.argv.host || DEFAULT_HOST
    return startServer(port, host)
}

if (require.main === module) {
    main()
}

export default HbbTVDriver
