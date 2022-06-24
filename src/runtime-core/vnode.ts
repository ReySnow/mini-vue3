import { isArray, isObject } from "../shared/index"
import { shapeFlags } from "./shapeFlags"

export const Fragment = Symbol('Fragment')
export const Text = Symbol('Text')

export { createVNode as createElementVnode }

// 创建虚拟节点
export function createVNode(type, props?, children?) {
    const vnode = {
        type,
        props,
        children,
        component: null,
        el: null,
        key: props && props.key,
        shapeFlag: getShapeFlage(type)
    }
    if (typeof children === 'string') {
        vnode.shapeFlag |= shapeFlags.TEXT_CHILDREN
    } else if (isArray(children)) {
        vnode.shapeFlag |= shapeFlags.ARRAY_CHILDREND
    }

    if (vnode.shapeFlag & shapeFlags.STATEFUL_COMPONENT) {
        if (isObject(children)) {
            // 设置具有solts
            vnode.shapeFlag |= shapeFlags.SLOT_CHILDREN
        }
    }

    return vnode
}

// 创建text类型的虚拟节点 渲染text文本
export function createTextVNode(text: string) {
    return createVNode(Text, {}, text)
}

function getShapeFlage(type: any) {
    return typeof type === 'string'
        ? shapeFlags.ELELEMT
        : shapeFlags.STATEFUL_COMPONENT
}
