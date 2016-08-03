import log from './logger'
import { server as baseServer, routeConfiguringFunction } from 'appium-base-driver'
import { HbbTVDriver } from './driver'

async function startServer (port, host) {
    let driver = new HbbTVDriver()
    let router = routeConfiguringFunction(driver)
    let server = baseServer(router, port, host)
    log.info(`HbbTVDriver server listening on http://${host}:${port}`)
    return server
}

export { startServer }
