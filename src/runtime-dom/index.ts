
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

const insert = (child, parent, anchor) => {
    // parent.append(el)
    parent.insertBefore(child, anchor || null)
}

// 移除一个元素
const remove = (child) => {
    const parent = child.parentNode
    if (parent) {
        parent.removeChild(child)
    }
}

const setElementText = (el, text) => {
    el.textContent = text
}

// 创建 runtime-dom 的自定义渲染器
const renderer: any = createRenderer({
    createElement,
    patchProp,
    insert,
    remove,
    setElementText
})

// 导出 runtime-dom 的createApp
export function createApp(...args) {
    return renderer.createApp(...args)
}

// runtime-dom -> runtime-core
export * from '../runtime-core'
