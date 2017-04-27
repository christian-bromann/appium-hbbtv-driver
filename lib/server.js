import logger from './logger'
import { server as baseServer, routeConfiguringFunction } from 'appium-base-driver'
import HbbTVDriver from './driver'
import AppProxy from './proxy'

async function startServer (port, host) {
    const driver = new HbbTVDriver()
    const router = routeConfiguringFunction(driver)
    const server = baseServer(router, port, host)
    const log = logger()

    /**
     * start remote debugging backend
     */
    driver.proxy = new AppProxy()
    await driver.proxy.run()

    log.info(`HbbTVDriver server listening on http://${host}:${port}`)
    return server
}

export { startServer }
