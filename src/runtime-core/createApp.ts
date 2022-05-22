import { createVNode } from "./vnode"

export function createAppAPI(render) {
    return function createApp(rootComponent) {
        return {
            mount(rootContainer) {
                // component 转换成vnode 逻辑基于vnode操作
                const vnode = createVNode(rootComponent)

                render(vnode, rootContainer)
            }
        }
    }
}
