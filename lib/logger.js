import npmlog from 'npmlog'

/**
 * levels that are available from `npmlog`
 */
const NPM_LEVELS = ['silly', 'verbose', 'debug', 'info', 'http', 'warn', 'error']

npmlog.addLevel('debug', 1000, { fg: 'blue', bg: 'black' }, 'dbug')

export default function HbbTVLogger (component) {
    const wrappedLogger = {}
    const prefix = 'HbbTV' + (component ? `:${component}` : '')

    /**
     * add all the levels from `npmlog`, and map to the underlying logger
     */
    for (let level of NPM_LEVELS) {
        wrappedLogger[level] = npmlog[level].bind(npmlog, prefix)
    }

    return wrappedLogger
}
