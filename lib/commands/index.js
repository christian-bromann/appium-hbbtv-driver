import location from './location'

let commands = {}

for (let obj of [location]) {
    Object.assign(commands, obj)
}

export default commands
export { commands }
