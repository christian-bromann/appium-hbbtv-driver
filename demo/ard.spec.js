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
            browser.pause(1000)
            expect(browser.getText('.barbottom .seltxt')).to.be.equal('Das Erste Mediathek')
        })

        it('should switch to Tatort', () => {
            browser.pause(1000)
            browser.keys('left')
            browser.pause(1000)
            browser.keys('left')
            expect(browser.getText('.barbottom .seltxt')).to.be.equal('Der Tatort im Ersten')
        })
    })
})
