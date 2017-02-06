import { getLogger } from 'appium-logger'

export default function HbbTVLogger (component) {
    return getLogger('HbbTV' + (component ? `:${component}` : ''))
}
