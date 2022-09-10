import { mutableHandlers, readonlyHandlers, shallowReadonlyHandlers } from "./baseHandlers"

export const enum ReactiveFlags {
    IS_REACTIVE = '__v_isReactive',
    IS_READONLY = '__v_isReadonly'
}

export function reactive(raw) {
    return createActiviteObject(raw, mutableHandlers)
}

export function readonly(raw) {
    return createActiviteObject(raw, readonlyHandlers)
}

export function shallowReadonly(raw) {
    return createActiviteObject(raw, shallowReadonlyHandlers)
}

export function isReactive(value) {
    // 普通对象得到 undefined
    return !!value[ReactiveFlags.IS_REACTIVE]
}

export function isReadonly(value) {
    return !!value[ReactiveFlags.IS_READONLY]
}

export function isProxy(value) {
    return isReactive(value) || isReadonly(value)
}

function createActiviteObject(raw: any, baseHandlers) {
    // 创建响应式对象
    return new Proxy(raw, baseHandlers)
}
