import { expect } from 'chai'

import HeroApp from './pageobjects/HeroApp'

describe('ARD HbbTV app', () => {
    before(() => {
        HeroApp.open()
    })

    it('should have correct title', () => {
        expect(browser.getTitle()).to.be.equal('ARD Startleiste')
    })

    describe('can open app screen', () => {
        it('should not display app screen at the beginning', () => {
            expect(HeroApp.appscreen.isVisible()).to.be.equal(false)
            expect(HeroApp.hbbNotifier.isVisible()).to.be.equal(true)
        })

        it('should press red button to enable app', () => {
            browser.keys('red')
            HeroApp.appscreen.waitForVisible()
            expect(HeroApp.hbbNotifier.isVisible()).to.be.equal(false)
        })

        it('should display Mediathek app', () => {
            expect(HeroApp.selectedAppHeadline.getText()).to.be.equal('Das Erste Mediathek')
        })

        it('should switch to Tatort', () => {
            browser.keys('left')
            browser.keys('left')
            expect(HeroApp.selectedAppHeadline.getText()).to.be.equal('Der Tatort im Ersten')
        })
    })

    describe('has a settings menu', () => {
        it('should not display settings per default', () => {
            expect(HeroApp.settingsView.isVisible()).to.be.equal(false)
            expect(HeroApp.barView.isVisible()).to.be.equal(true)
        })

        it('should open settings', () => {
            browser.keys('down')
            browser.keys('enter')
            expect(HeroApp.settingsView.isVisible()).to.be.equal(true)
            expect(HeroApp.barView.isVisible()).to.be.equal(false)
        })

        it('should enabled accessibility', () => {
            browser.keys('down')
            browser.keys('down')
            browser.keys('down')
            browser.keys('enter')
            const videotextBtn = HeroApp.actionButtons[0]
            expect(videotextBtn.getText()).to.be.equal('Blau: Videotext')
            expect(videotextBtn.getAttribute('class')).to.be.equal('colbuttontxt lg')
        })

        it('should store settings so they are available after reopening app', () => {
            HeroApp.open()
            HeroApp.hbbNotifier.waitForVisible()
            browser.keys('red')
            HeroApp.appscreen.waitForVisible()

            const videotextBtn = HeroApp.actionButtons[0]
            expect(videotextBtn.getText()).to.be.equal('Blau: Videotext')
            expect(videotextBtn.getAttribute('class')).to.be.equal('colbuttontxt lg')
        })

        it('should disable accessibility', () => {
            // go back to settings page
            browser.keys('down')
            browser.keys('enter')

            browser.keys('up')
            browser.keys('up')
            browser.keys('up')
            browser.keys('enter')
            const videotextBtn = HeroApp.actionButtons[0]
            expect(videotextBtn.getText()).to.be.equal('Videotext')
            expect(videotextBtn.getAttribute('class')).to.be.equal('colbuttontxt')
        })
    })
})
