import stringify from 'json-stringify-safe'
import validator from 'validator'

const OBJLENGTH = 10
const ARRLENGTH = 10
const STRINGLIMIT = 1000
const STRINGTRUNCATE = 200

/**
 * Limit the length of an arbitrary variable of any type, suitable for being logged or displayed
 * @param  {Any} val Any variable
 * @return {Any}     Limited var of same type
 */
function limit (val) {
    if (!val) return val

    // Ensure we're working with a copy
    val = JSON.parse(stringify(val))

    switch (Object.prototype.toString.call(val)) {
    case '[object String]':
        if (val.length > 100 && validator.isBase64(val)) {
            return '[base64] ' + val.length + ' bytes'
        }

        if (val.length > STRINGLIMIT) {
            return val.substr(0, STRINGTRUNCATE) + ' ... (' + (val.length - STRINGTRUNCATE) + ' more bytes)'
        }

        return val
    case '[object Array]':
        const length = val.length
        if (length > ARRLENGTH) {
            val = val.slice(0, ARRLENGTH)
            val.push('(' + (length - ARRLENGTH) + ' more items)')
        }
        return val.map(limit)
    case '[object Object]':
        const keys = Object.keys(val)
        const removed = []
        for (let i = 0, l = keys.length; i < l; i++) {
            if (i < OBJLENGTH) {
                val[keys[i]] = limit(val[keys[i]])
            } else {
                delete val[keys[i]]
                removed.push(keys[i])
            }
        }
        if (removed.length) {
            val._ = (keys.length - OBJLENGTH) + ' more keys: ' + JSON.stringify(removed)
        }
        return val
    }
    return val
}

export { limit }
