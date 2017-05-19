import { expect } from 'chai'

import ARDApp from '../pageobjects/ard.page'

describe('ARD HbbTV app', () => {
    before(() => {
        ARDApp.open()
    })

    it('should have correct title', () => {
        expect(browser.getTitle()).to.be.equal('ARD Startleiste')
    })

    describe('can open app screen', () => {
        it('should not display app screen at the beginning', () => {
            expect(ARDApp.appscreen.isVisible()).to.be.equal(false)
            expect(ARDApp.hbbNotifier.isVisible()).to.be.equal(true)
        })

        it('should press red button to enable app', () => {
            browser.keys('red')
            ARDApp.appscreen.waitForVisible()
            expect(ARDApp.hbbNotifier.isVisible()).to.be.equal(false)
        })

        it('should display Mediathek app', () => {
            expect(ARDApp.selectedAppHeadline.getText()).to.be.equal('Das Erste Mediathek')
        })

        it('should switch to Tatort', () => {
            browser.keys('left')
            browser.keys('left')
            expect(ARDApp.selectedAppHeadline.getText()).to.be.equal('Der Tatort im Ersten')
        })
    })

    describe('has a settings menu', () => {
        it('should not display settings per default', () => {
            expect(ARDApp.settingsView.isVisible()).to.be.equal(false)
            expect(ARDApp.barView.isVisible()).to.be.equal(true)
        })

        it('should open settings', () => {
            browser.keys('down')
            browser.keys('enter')
            expect(ARDApp.settingsView.isVisible()).to.be.equal(true)
            expect(ARDApp.barView.isVisible()).to.be.equal(false)
        })

        it('should enabled accessibility', () => {
            browser.keys('down')
            browser.keys('down')
            browser.keys('down')
            browser.keys('enter')
            const videotextBtn = ARDApp.actionButtons[0]
            expect(videotextBtn.getText()).to.be.equal('Blau: Videotext')
            expect(videotextBtn.getAttribute('class')).to.be.equal('colbuttontxt lg')
        })

        it('should store settings so they are available after reopening app', () => {
            ARDApp.open()
            ARDApp.hbbNotifier.waitForVisible()
            browser.keys('red')
            ARDApp.appscreen.waitForVisible()

            const videotextBtn = ARDApp.actionButtons[0]
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
            const videotextBtn = ARDApp.actionButtons[0]
            expect(videotextBtn.getText()).to.be.equal('Videotext')
            expect(videotextBtn.getAttribute('class')).to.be.equal('colbuttontxt')
        })
    })
})
