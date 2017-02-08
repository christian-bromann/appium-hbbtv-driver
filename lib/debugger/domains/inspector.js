let enabled = false
const name = 'Inspector'

/**
 * Enables inspector domain notifications.
 */
export function enable () {
    enabled = true
    return {}
}

/**
 * Disables inspector domain notifications.
 */
export function disable () {
    enabled = false
    return {}
}

export { name, enabled }
