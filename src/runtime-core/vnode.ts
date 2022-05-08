
// 创建虚拟节点
export function createVNode(type, props?, children?) {
    const vnode = {
        type,
        props,
        children
    }
    return vnode
}
