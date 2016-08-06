export default class HbbTVFrontendDriver {
    constructor () {
        this.socket = window.io()
    }

    onload () {
        console.log('LOADED')
    }
}
