import fs from 'fs'
import path from 'path'
import logger from '../logger'

const SETTINGS_FILE_PATH = path.resolve(__dirname, '..', '..', 'config.json')

class Settings {
    constructor () {
        this.log = logger('Settings')
        this.settings = {}

        try {
            this.settings = JSON.parse(fs.readFileSync(SETTINGS_FILE_PATH))
        } catch (e) {
            this.log.info('No settings file found or file was corrupted')
        }
    }

    write (data) {
        this.log.info('Write config to file:', data)
        this.settings = data
        fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(data), 'utf8')
    }

    read () {
        return this.settings
    }
}

export default new Settings()
