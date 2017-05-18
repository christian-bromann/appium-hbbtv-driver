import { expect } from 'chai'

describe('ARD HbbTV app', () => {
    before(() => {
        browser.url('http://itv.ard.de/ardstart/index.html')
    })

    it('should have correct title', () => {
        expect(browser.getTitle()).to.be.equal('ARD Startleiste')
    })

    describe('can open app screen', () => {
        it('should not display app screen at the beginning', () => {
            expect($('#appscreen').isVisible()).to.be.equal(false)
            expect($('#hidemsg').isVisible()).to.be.equal(true)
        })

        it('should press red button to enable app', () => {
            browser.keys('red')
            $('#appscreen').waitForVisible()
            expect($('#hidemsg').isVisible()).to.be.equal(false)
        })

        it('should display Mediathek app', () => {
            expect($('.barbottom .seltxt').getText()).to.be.equal('Das Erste Mediathek')
        })

        it('should switch to Tatort', () => {
            browser.keys('left')
            browser.keys('left')
            expect($('.barbottom .seltxt').getText()).to.be.equal('Der Tatort im Ersten')
        })
    })

    describe('has a settings menu', () => {
        it('should not display settings per default', () => {
            expect($('#appscreen #settings').isVisible()).to.be.equal(false)
            expect($('#appscreen #bar').isVisible()).to.be.equal(true)
        })

        it('should open settings', () => {
            browser.keys('down')
            browser.keys('enter')
            expect($('#appscreen #settings').isVisible()).to.be.equal(true)
            expect($('#appscreen #bar').isVisible()).to.be.equal(false)
        })

        it('should enabled accessibility', () => {
            browser.keys('down')
            browser.keys('down')
            browser.keys('down')
            browser.keys('enter')
            const buttonTxt = $('.barcolbuttons .colbuttontxt')
            expect(buttonTxt.getText()).to.be.equal('Blau: Videotext')
            expect(buttonTxt.getAttribute('class')).to.be.equal('colbuttontxt lg')
        })

        it('should store settings so they are available after reopening app', () => {
            browser.url('http://itv.ard.de/ardstart/index.html')
            $('#hidemsg').waitForVisible()
            browser.keys('red')
            $('#appscreen').waitForVisible()

            const buttonTxt = $('.barcolbuttons .colbuttontxt')
            expect(buttonTxt.getText()).to.be.equal('Blau: Videotext')
            expect(buttonTxt.getAttribute('class')).to.be.equal('colbuttontxt lg')
        })

        it('should disable accessibility', () => {
            // go back to settings page
            browser.keys('down')
            browser.keys('enter')

            browser.keys('up')
            browser.keys('up')
            browser.keys('up')
            browser.keys('enter')
            const buttonTxt = $('.barcolbuttons .colbuttontxt')
            expect(buttonTxt.getText()).to.be.equal('Videotext')
            expect(buttonTxt.getAttribute('class')).to.be.equal('colbuttontxt')
        })
    })
})
