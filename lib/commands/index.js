import navigation from './navigation'
import documentHandling from './documentHandling'
import elementInteraction from './elementInteraction'
import elementState from './elementState'
import gesture from './gesture'
import cookie from './cookie'
import find from './find'

let commands = {}

for (let obj of [
    navigation,
    documentHandling,
    elementInteraction,
    elementState,
    gesture,
    find,
    cookie
]) {
    Object.assign(commands, obj)
}

export default commands
export { commands }
