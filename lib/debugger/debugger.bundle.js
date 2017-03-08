import RemoteDebugger from './remoteDebugger'

function getCookie (n) {
    let a = `; ${document.cookie}`.match(`;\\s*${n}=([^;]+)`)
    return a ? a[1] : ''
}

const remoteDebugger = new RemoteDebugger(getCookie('requestId'))

/**
 * trigger executionContextCreated event
 */
window.onload = () => {
    remoteDebugger.executionContextCreated()
}
