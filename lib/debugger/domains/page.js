let enabled = false
const name = 'Page'

/**
 * Reloads given page optionally ignoring the cache.
 *
 * @param  {Boolean} ignoreCache If true, browser cache is ignored (as if the user pressed Shift+refresh).
 */
export function reload (ignoreCache = false) {
    window.location.reload(ignoreCache)
    return {}
}

/**
 * Navigates current page to the given URL.
 *
 * @param  {String} url  URL to navigate the page to.
 */
export function navigate (url) {
    if (typeof url !== 'string') {
        return
    }

    window.location.assign(url)
    return {}
}

export { name, enabled }
