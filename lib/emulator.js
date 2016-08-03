import VirtualBox from 'virtualbox-promise'

export default class OperaTVEmulator {
    constructor (opts) {
        this.opts = opts
    }

    /**
     * creates a virtual box profile for the Opera TV simulator
     * (if not existing)
     */
    async initializeProfile () {
        const profiles = await this.getProfiles()
        console.log(profiles)
    }

    boot () {

    }

    async getProfiles () {
        const profiles = await VirtualBox.manage(['list', 'vms'])
        return profiles.split('\n').map((p) => {
            p = p.split('" {')
            return {
                name: p[0].slice(1),
                id: p[1].slice(0, -1)
            }
        })
    }
}
