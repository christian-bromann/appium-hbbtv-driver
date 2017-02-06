import navigation from './navigation'
import documentHandling from './documentHandling'
import elementState from './elementState'
import gesture from './gesture'
import find from './find'

let commands = {}

for (let obj of [navigation, documentHandling, elementState, gesture, find]) {
    Object.assign(commands, obj)
}

export default commands
export { commands }
