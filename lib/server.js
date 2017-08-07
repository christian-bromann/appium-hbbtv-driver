import { server as baseServer, routeConfiguringFunction } from 'appium-base-driver'

import logger from './logger'
import HbbTVDriver from './driver'
import DriverViews from './server/views'

const log = logger()

async function startServer (port, host) {
    const driver = new HbbTVDriver()
    const router = routeConfiguringFunction(driver)
    const server = baseServer((app) => {
        /**
         * register driver specific endpoints to backend server
         */
        DriverViews.create(app, driver)

        return router(app)
    }, port, host)

    log.info(`HbbTVDriver server listening on http://${host}:${port}`)
    return server
}

export { startServer }
