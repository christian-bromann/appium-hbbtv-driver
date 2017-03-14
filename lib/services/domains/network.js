import zlib from 'zlib'
import { hasGzipEncoding } from '../../utils'

/**
 * Returns content served for the given request.
 *
 * @param {Number}  id      socket id
 * @param {Object}  params  parameter object containing requestId
 * @return                  response as base64 encoded
 */
export function getResponseBody ({ id, params }) {
    const request = this.requestList.filter((req) => req.requestId === params.requestId)[0]

    if (!request) {
        return { 'error': `Couldn't find request with id ${params.requestId}` }
    }

    /**
     * if request in not encoded return immediately
     */
    console.log('has gezuo encoding?', request.fullUrl, hasGzipEncoding(request.request))
    if (!hasGzipEncoding(request.request)) {
        return { body: request.chunks.join('') }
    }

    console.log(request.fullUrl, 'chunksize', request.chunks.length)
    zlib.gunzip(Buffer.concat(request.chunks), (err, body) => {
        if (err) {
            this.log.error(err)
            return
        }

        if (!body) {
            this.log.error(new Error('Gzip decoding failed'))
            return
        }

        return this.broadcast({
            id,
            result: {
                base64Encoded: false,
                body: body.toString()
            }
        })
    })
}
