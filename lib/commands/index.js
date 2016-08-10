import navigation from './navigation'
import document from './document'
import gesture from './gesture'
import execute from './execute'
import find from './find'

let commands = {}

for (let obj of [navigation, document, gesture, execute, find]) {
    Object.assign(commands, obj)
}

export default commands
export { commands }
