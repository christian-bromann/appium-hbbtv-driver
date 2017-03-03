import { expect } from 'chai'
import {
    getDomain,
    hasGzipEncoding
} from '../lib/utils'

describe('utils', () => {
    it('getDomain', () => {
        let domain = 'hbbtv.zdf.de'
        expect(getDomain(domain)).to.be.equal('zdf.de')

        domain = 'a.b.c.d.e.f'
        expect(getDomain(domain)).to.be.equal('e.f')
    })

    it('hasGzipEncoding', () => {
        expect(hasGzipEncoding({ headers: { 'accept-encoding': 'gzip deflate' } })).to.be.ok
        expect(hasGzipEncoding({ headers: { 'accept-encoding': 'foobar' } })).to.be.not.ok
        expect(hasGzipEncoding({ headers: {} })).to.be.not.ok
    })
})
