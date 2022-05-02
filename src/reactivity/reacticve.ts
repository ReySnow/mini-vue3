import { mutableHandlers, readonlyHandlers } from "./baseHandlers"

export function reactive(raw) {
    return createActiviteObject(raw, mutableHandlers)
}

export function readonly(raw) {
    return createActiviteObject(raw, readonlyHandlers)
}

function createActiviteObject(raw: any, baseHandlers) {
    // 创建响应式对象
    return new Proxy(raw, baseHandlers)
}
