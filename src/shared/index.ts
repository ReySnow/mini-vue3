export const extend = Object.assign

export const isObject = (val) => {
    return val !== null && typeof val === 'object'
}

export const isString = (val) => typeof val === 'string'

export const isArray = Array.isArray

export const EMPTY_OBJ = {}

export const hasChanged = (val, newVal) => {
    return !Object.is(val, newVal)
}

export const hasOwn = (val, key) => Object.prototype.hasOwnProperty.call(val, key)

// xx-xx => xxXx 转驼峰
export const camelize = (str: string) => {
    return str.replace(/-(\w)/g, (_, v) => {
        return v ? v.toUpperCase() : ''
    })
}
// 首字母转大写
export const capitalize = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1)
}

export const toHandlerKey = (str: string) => {
    return str ? `on${capitalize(str)}` : ''
}
