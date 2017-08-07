import logger from '../logger'

export default class Router {
    get routes () {
        return {}
    }

    constructor (app) {
        this.app = app
        this.log = logger('Router')

        if (!this.app) {
            throw new Error('Missing app property')
        }

        this.registerRoutes()
    }

    registerRoutes () {
        var routes = this.routes

        Object.keys(routes).forEach((path) => {
            const method = routes[path]
            const pathArray = path.split(' ')
            let verb = 'get'

            if (pathArray.length > 1) {
                verb = pathArray[0]
                path = pathArray[1]
            }

            this.log.info(`Register route: ${verb} ${path}`)
            this.app[verb.toLowerCase()](path, this[method].bind(this))
        })
    }
}
