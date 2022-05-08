import { createComponentInstance, setupComponent } from "./component"

export function render(vnode, container: any) {
    // 递归处理
    patch(vnode, container)
}

function patch(vnode: any, container: any) {
    // 判断vnode类型 component element

    processComponent(vnode, container)
}

// 处理类型为component的vnode
function processComponent(vnode: any, container: any) {
    mountComponent(vnode, container)
}

// 挂载component
function mountComponent(vnode: any, container: any) {
    // 创建组件实例
    const instance = createComponentInstance(vnode)

    setupComponent(instance)
    setupRenderEffect(instance, container)
}

function setupRenderEffect(instance, container) {
    // finishComponent 中设置了render
    // subtree 就是虚拟节点
    const subtree = instance.render()
    patch(subtree, container)
}

