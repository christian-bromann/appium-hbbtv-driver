import RemoteDebugger from './remoteDebugger'

function getCookie (n) {
    let a = `; ${document.cookie}`.match(`;\\s*${n}=([^;]+)`)
    return a ? a[1] : ''
}

window.MutationObserver = window.MutationObserver ||
    window.WebKitMutationObserver ||
    window.MozMutationObserver

const remoteDebugger = window.remoteDebugger = new RemoteDebugger(getCookie('requestId'))

/**
 * store onload handler that could be defined by the HbbTV app
 */
const onload = window.onload || (() => {})

/**
 * trigger executionContextCreated event
 */
window.onload = () => {
    remoteDebugger.domains.Runtime.executionContextCreated.call(remoteDebugger)
    remoteDebugger.domains.CSS.styleSheetAdded.call(remoteDebugger)
    remoteDebugger.domains.Debugger.scriptParsed.call(remoteDebugger)
    remoteDebugger.domains.Page.frameNavigated.call(remoteDebugger)
    remoteDebugger.domains.Page.frameStoppedLoading.call(remoteDebugger)
    remoteDebugger.domains.DOM.documentUpdated.call(remoteDebugger)
    onload()
}

/**
 * trigger frameStartedLoading
 */
remoteDebugger.domains.Page.frameStartedLoading.call(remoteDebugger)
