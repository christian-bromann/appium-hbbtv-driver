import fs from 'fs'
import path from 'path'
import { expect } from 'chai'
import {
    getDomain,
    hasGzipEncoding,
    getIpAddress,
    writeConfig,
    readConfig
} from '../lib/utils'

describe('utils', () => {
    it('getDomain', () => {
        let domain = 'hbbtv.zdf.de'
        expect(getDomain(domain)).to.be.equal('zdf.de')

        domain = 'a.b.c.d.e.f'
        expect(getDomain(domain)).to.be.equal('e.f')
    })

    it('hasGzipEncoding', () => {
        expect(hasGzipEncoding({ headers: { 'accept-encoding': 'gzip deflate' } })).to.be.ok()
        expect(hasGzipEncoding({ headers: { 'accept-encoding': 'foobar' } })).to.be.not.ok()
        expect(hasGzipEncoding({ headers: {} })).to.be.not.ok()
    })

    /**
     * fails in Travis - lo0 IP is null
     */
    it.skip('getIpAddress', () => {
        expect(getIpAddress()).to.be.equal(null)
        expect(getIpAddress('lo0')).to.be.equal('127.0.0.1')
        expect(getIpAddress('lo0', 'ipv6')).to.be.equal('::1')
    })

    describe('should be able to read and write to config file', () => {
        const configPath = path.resolve(__dirname, '..', 'config.json')

        it('should return undefined if config is not available', () => {
            const data = readConfig()
            expect(data).to.be.a('object')
            expect(JSON.stringify(data)).to.be.equal('{"data":{}}')
        })

        it('writeConfig', () => {
            writeConfig('jojo')
            expect(fs.existsSync(configPath)).to.be.ok()
        })

        it('readConfig', () => {
            const data = readConfig()
            expect(data).to.be.a('object')
            expect(JSON.stringify(data)).to.be.equal('{"data":"jojo"}')
            expect(fs.existsSync(configPath)).to.be.ok()
        })

        after(() => {
            fs.unlinkSync(configPath)
        })
    })
})
