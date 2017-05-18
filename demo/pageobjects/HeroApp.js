class HeroApp {
    get appscreen () {
        return $('#appscreen')
    }

    get hbbNotifier () {
        return $('#hidemsg')
    }

    get selectedAppHeadline () {
        return $('.barbottom .seltxt')
    }

    get barView () {
        return $('#appscreen #bar')
    }

    get settingsView () {
        return $('#appscreen #settings')
    }

    get actionButtons () {
        return $$('.barcolbuttons .colbuttontxt')
    }

    open () {
        browser.url('http://itv.ard.de/ardstart/index.html')
    }
}

export default new HeroApp()
