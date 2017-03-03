/**
 * helper method to emulate key event on page
 *
 * @param  {Number} keyCode key code to be simulated
 */
function triggerKeyboardEvent (keyCode) {
    const eventObj = document.createEventObject
        ? document.createEventObject() : document.createEvent('Events')

    if (eventObj.initEvent) {
        eventObj.initEvent('keydown', true, true)
    }

    eventObj.keyCode = keyCode
    eventObj.which = keyCode

    document.body.dispatchEvent
        ? document.body.dispatchEvent(eventObj) : document.body.fireEvent('onkeydown', eventObj)
}

/**
 * keys
 * This command is not officially supported in the Webdriver spec but since key events can't be
 * bound to an actual element (there are no input elements, only remote key events) adding this
 * command actually makes sense
 *
 * @param  {String}   sessionId sessionId
 * @param  {String[]} keys      list of key actions to be triggered
 */
export function keys ({ sessionId, value }) {
    /**
     * transform key array back to string
     */
    if (Array.isArray(value)) {
        value = value.join('')
    }

    const key = value.slice(0, 3).toUpperCase() === 'VK_' ? value.toUpperCase() : `VK_${value.toUpperCase()}`

    /**
     * check if key is supported
     */
    if (!window.KeyEvent[key]) {
        return this.error('go', 'InvalidArgumentError', `key "${key}" is not supported by this device`)
    }

    triggerKeyboardEvent(window.KeyEvent[key])
    return this.respond('keys', null)
}
