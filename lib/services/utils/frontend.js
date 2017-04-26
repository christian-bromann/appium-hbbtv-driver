/**
 * get origin of backend depending on whether scripts get injected or referenced
 * by launcher
 */
export function getDriverOrigin () {
    /**
     * check if executed by launcher script
     */
    if (document.currentScript && document.currentScript.src) {
        return `http://` + document.currentScript.src.split('/').slice(2, 3)[0]
    }

    return document.location.origin
}
