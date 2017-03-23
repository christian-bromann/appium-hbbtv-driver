import ObjectStore from '../models/ObjectStore'

export const SUB_TYPES = [
    'array', 'null', 'node', 'regexp', 'date', 'map', 'set', 'iterator',
    'generator', 'error', 'promise', 'typedarray'
]

/**
 * Facade for subtype property
 */
export class PropertyObject {
    constructor (object) {
        const subtype = PropertyObject.getSubType(object)
        const type = typeof object

        if (type.match(/^(number|string|undefined|boolean)$/) || subtype === 'null') {
            return new PrimitiveObject(object, subtype)
        }

        return PropertyObject.createPropertyInstance(object, subtype)
    }

    static createPropertyInstance (object, subtype) {
        if (subtype === 'array') return new ArrayObject(object, subtype)
        if (subtype === 'null') return new PrimitiveObject(object, subtype)
        if (subtype === 'undefined') return new PrimitiveObject(object, subtype)
        if (subtype === 'node') return new NodeObject(object, subtype)
        if (subtype === 'regexp') return new CompositeObject(object, subtype)
        if (subtype === 'date') return new CompositeObject(object, subtype)
        if (subtype === 'map') return new CompositeObject(object, subtype)
        if (subtype === 'set') return new CompositeObject(object, subtype)
        if (subtype === 'iterator') return new CompositeObject(object, subtype)
        if (subtype === 'generator') return new CompositeObject(object, subtype)
        if (subtype === 'error') return new ErrorObject(object, subtype)
        if (subtype === 'promise') return new PromiseObject(object, subtype)
        if (subtype === 'typedarray') return new TypedarrayObject(object, subtype)
        return new CompositeObject(object)
    }

    /**
     * returns subtype of object
     */
    static getSubType (object) {
        /**
         * null
         */
        if (object === null) {
            return 'null'
        }

        /**
         * undefined
         */
        if (typeof object === 'undefined') {
            return 'undefined'
        }

        /**
         * objects can have cases where constructor is null
         */
        if (!object.constructor) {
            return 'map'
        }

        const constructorName = object.constructor.name

        /**
         * error
         */
        if (object instanceof Error || constructorName.match(/Error$/)) {
            return 'error'
        }

        /**
         * array
         */
        if (Array.isArray(object) || (typeof object.length === 'number' && object.constructor.name !== 'object')) {
            return 'array'
        }

        /**
         * node
         */
        if (typeof object.nodeType === 'number') {
            return 'node'
        }

        /**
         * iterator
         */
        if (object.iterator) {
            return 'iterator'
        }

        /**
         * generator
         */
        if (constructorName === 'GeneratorFunction') {
            return 'generator'
        }

        /**
         * promise
         */
        if (object instanceof Promise) {
            return 'promise'
        }

        /**
         * typedarray
         */
        if (constructorName.match(/^Float(\d+)Array$/)) {
            return 'typedarray'
        }

        /**
         * constructorName check
         */
        if (SUB_TYPES.indexOf(constructorName.toLowerCase()) > -1) {
            return constructorName.toLowerCase
        }
    }
}

class PrimitiveObject {
    isPrimitive = true

    constructor (object, subtype) {
        this.object = object
        this.subtype = subtype || this.subtype
        this.type = typeof object
        this.value = this.object
        this.className = this.object ? this.object.constructor.name : undefined
    }

    get () {
        const { value, subtype, type } = this
        return { value, subtype, type }
    }
}

class CompositeObject extends PrimitiveObject {
    isPrimitive = false

    get () {
        const { className, description, subtype, type } = this
        const id = ObjectStore.push(this.object)
        const objectId = JSON.stringify({ injectedScriptId: 1, id })
        return { className, description, objectId, subtype, type }
    }

    get description () {
        return this.object.toString()
    }
}

class ArrayObject extends CompositeObject {
    className = 'Array'

    get description () {
        return `${this.className}(${this.object.length})`
    }
}

class NodeObject extends CompositeObject {
    constructor (object, subtype) {
        super(object, subtype)
        this.value = this.getValue()
        this.className = this.object.constructor.name
    }

    get () {
        const { name, subtype, type, value } = this
        return { name, subtype, type, value }
    }

    get description () {
        return this.object.nodeName.toLowerCase()
    }

    getValue () {
        let value = this.object.nodeName.toLowerCase()

        if (this.object.id) {
            value += `#${this.object.id}`
        }

        if (this.object.className) {
            value += `.${this.object.className.replace(' ', '.')}`
        }

        return value
    }
}

class ErrorObject extends CompositeObject {
    className = 'Error'

    get description () {
        return this.object.stack
    }
}

class PromiseObject extends CompositeObject {
    className = 'Promise'
    description = 'Promise'
}

class TypedarrayObject extends CompositeObject {
    className = 'TypedarrayObject'
    description = 'TypedarrayObject'
}