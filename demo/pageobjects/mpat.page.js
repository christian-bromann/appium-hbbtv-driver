class MPATPage {
    get appElement () {
        return $('#main')
    }

    get launcherElements () {
        return $$('.launcherElement')
    }

    get focusedLauncherElement () {
        return $('.launcherElement.focused')
    }

    open () {
        browser.url('http://52.58.133.10/MPAT-core/web/mws')
        this.appElement.waitForExist()
    }
}

export default new MPATPage()
