import navigation from './navigation'
import document from './document'
import gesture from './gesture'
import find from './find'

let commands = {}

for (let obj of [navigation, document, gesture, find]) {
    Object.assign(commands, obj)
}

export default commands
export { commands }
