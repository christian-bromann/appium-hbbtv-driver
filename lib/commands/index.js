import navigation from './navigation'
import document from './document'

let commands = {}

for (let obj of [navigation, document]) {
    Object.assign(commands, obj)
}

export default commands
export { commands }
