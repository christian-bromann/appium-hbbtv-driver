import navigation from './navigation'

let commands = {}

for (let obj of [navigation]) {
    Object.assign(commands, obj)
}

export default commands
export { commands }
