import { isArray } from "../shared/index"
import { shapeFlags } from "./shapeFlags"

// 创建虚拟节点
export function createVNode(type, props?, children?) {
    const vnode = {
        type,
        props,
        children,
        el: null,
        shapeFlag: getShapeFlage(type)
    }
    if (typeof children === 'string') {
        vnode.shapeFlag |= shapeFlags.TEXT_CHILDREN
    } else if (isArray(children)) {
        vnode.shapeFlag |= shapeFlags.ARRAY_CHILDREND
    }

    return vnode
}

function getShapeFlage(type: any) {
    return typeof type === 'string'
        ? shapeFlags.ELELEMT
        : shapeFlags.STATEFUL_COMPONENT
}
