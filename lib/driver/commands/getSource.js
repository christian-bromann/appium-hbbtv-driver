export default function getSource ({ sessionId }) {
    this.socket.emit('getSource', {
        sessionId,
        value: document.documentElement.outerHTML
    })
}
