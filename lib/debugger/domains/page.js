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

/**
 * Information about the Frame hierarchy along with their cached resources.
 * @return {Object} frame tree
 */
export function getResourceTree () {
    return {
        frameTree: {
            childFrames: [],
            frame: {
                id: this.requestId,
                loaderId: this.requestId + '0', // ToDo add loader
                mimeType: 'text/html',
                securityOrigin: document.location.origin,
                url: document.location.origin
            }
        }
    }
}

/**
 * Controls whether browser will open a new inspector window for connected pages.
 *
 * @param {Boolean} autoAttach  If true, browser will open a new inspector window for
 *                              every page created from this one.
 */
export function setAutoAttachToCreatedPages ({ autoAttach }) {
    return {}
}

/**
 * Events
 */

/**
 * Fired when frame has started loading.
 */
export function frameStartedLoading () {
    this.execute('Page.frameStartedLoading', { frameId: this.requestId })
}

/**
 * Fired when frame has stopped loading.
 */
export function frameStoppedLoading () {
    this.execute('Page.frameStoppedLoading', { frameId: this.requestId })
}

/**
 * Fired once navigation of the frame has completed. Frame is now associated with
 * the new loader.
 */
export function frameNavigated () {
    this.execute('Page.frameNavigated', {
        frame: {
            id: this.requestId,
            loaderId: this.requestId + '0', // ToDo add loader
            mimeType: 'text/html',
            securityOrigin: document.location.origin,
            url: document.location.href
        }
    })
}

export { name, enabled }
