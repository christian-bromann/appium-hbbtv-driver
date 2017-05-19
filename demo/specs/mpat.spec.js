import { expect } from 'chai'

import MPATApp from '../pageobjects/mpat.page'

describe('mpat app', () => {
    it('should open the correct app', () => {
        MPATApp.open()
        expect(browser.getTitle()).to.be.equal('Media Web Symposium')
    })

    it('should have 6 launcher apps', () => {
        browser.keys('red')
        expect(MPATApp.launcherElements).to.have.lengthOf(6)
    })

    it('should have focus on MWS app at beginning', () => {
        expect(MPATApp.focusedLauncherElement.$('a').getText()).to.be.equal('MWS 2017')
    })

    it('should open MWS app successfully', () => {
        browser.keys('enter')
        expect(browser.getUrl()).to.contain('MPAT-core/web/mws/red-button/launcher/media-web-symposium"')
    })
})
