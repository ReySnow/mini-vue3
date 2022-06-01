
import { createRenderer } from "../runtime-core";

const createElement = (type) => {
    return document.createElement(type)
}

const patchProp = (el, key, prevVal, nextVal) => {
    const isOn = (key: string) => /^on[A-Z]/.test(key)
    if (isOn(key)) {
        const even = key.slice(2).toLocaleLowerCase()
        el.addEventListener(even, nextVal)
    } else {
        if (nextVal === undefined || nextVal === null) {
            el.removeAttribute(key, nextVal)
        } else {
            el.setAttribute(key, nextVal)
        }
    }
}

const insert = (el, parent) => {
    parent.append(el)
}

// 创建 runtime-dom 的自定义渲染器
const renderer: any = createRenderer({
    createElement,
    patchProp,
    insert
})

// 导出 runtime-dom 的createApp
export function createApp(...args) {
    return renderer.createApp(...args)
}

// runtime-dom -> runtime-core
export * from '../runtime-core'
