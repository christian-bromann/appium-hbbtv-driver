import path from 'path'
import mime from 'mime-types'

export default class Request {
    constructor (req) {
        this.req = req

        console.log('CHECKING COOKUES', req.cookies)
        this.fullUrl = `${req.protocol}://${req.headers.host}${req.url}`
        this.documentURL = req.cookies.requestIdHost || this.fullUrl
        this.requestId = req.cookies.requestId
        this.frameId = req.cookies.frameId
        this.loaderId = req.cookies.frameId + '0'
        this.request = {
            headers: req.headers,
            /**
             * initial page request have VeryHigh initial priority
             */
            initialPriority: this.requestId.slice(-2) !== '.1' ? 'VeryHigh' : 'Medium',
            method: req.method,
            mixedContentType: 'none',
            postData: req.body,
            url: this.fullUrl
        }
        this.wallTime = (new Date()).getTime() / 1000
        this.requestBodySize = 0
        this.mimeType = mime.lookup(req.url)
    }

    requestWillBeSent () {
        const { documentURL, request, wallTime, timestamp, requestId, frameId, type } = this
        let initiator = { type: 'other' }

        /**
         * if request id doesn't end with '.1' it is a subsequent request
         * and therefor the initiator is defined in the requestIdHost cookie
         */
        if (requestId.slice(-2) !== '.1') {
            initiator = {
                lineNumber: 0,
                type: 'parser',
                url: documentURL
            }
        }

        return Object.assign({}, {
            documentURL,
            frameId,
            requestId,
            initiator,
            request,
            wallTime,
            timestamp,
            type
        })
    }

    requestServedFromCache () {
        return { requestId: this.requestId }
    }

    dataReceived (chunk) {
        this.requestBodySize += chunk.length
        return {
            requestId: this.requestId,
            dataLength: chunk.length,
            encodedDataLength: Buffer.isBuffer(chunk) ? chunk.toString('utf8').length : chunk.length,
            timestamp: this.timestamp
        }
    }

    responseReceived (response) {
        return {
            frameId: this.frameId,
            loaderId: this.loaderId,
            requestId: this.requestId,
            timestamp: this.timestamp,
            type: this.type,
            response: {
                headers: response.headers,
                status: response.statusCode,
                mimeType: this.mimeType,
                url: this.request.url
            }
        }
    }

    loadingFinished () {
        return {
            encodedDataLength: this.requestBodySize,
            requestId: this.requestId,
            timestamp: this.timestamp
        }
    }

    loadingFailed (error) {
        return {
            requestId: this.requestId,
            timestamp: this.timestamp,
            type: this.type,
            errorText: error.message,
            canceled: false
        }
    }

    get type () {
        if (this.req.url.match(/\.(png|jpg|jpeg|gif)$/i)) return 'Image'
        if (this.req.url.match(/\.(mp4|mp3|flv|wav)/i)) return 'Media'
        if (this.req.url.match(/\.(ttf|otf|woff|woff2)/i)) return 'Font'

        if (this.req.url.match(/\.js/i)) return 'Script'
        if (this.req.url.match(/\.css/i)) return 'Stylesheet'
        if (this.req.url.match(/\.(html|php)/i) || path.extname(this.req.url) === '') return 'Document'

        if (this.req.get('Upgrade') && this.req.get('Upgrade').match(/websocket/i)) return 'WebSocket'

        return 'Other'
    }

    get timestamp () {
        return ((new Date()).getTime() - this.wallTime) / 1000
    }
}
