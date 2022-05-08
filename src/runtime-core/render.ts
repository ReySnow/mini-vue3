import { isObject } from "../shared/index"
import { createComponentInstance, setupComponent } from "./component"

export function render(vnode, container: any) {
    // 递归处理
    patch(vnode, container)
}

function patch(vnode: any, container: any) {
    // 判断vnode类型 component element
    if (typeof vnode.type === 'string') {
        processElement(vnode, container)
    } else if (isObject(vnode.type)) {
        processComponent(vnode, container)
    }
}

// 处理类型为element的vnode
function processElement(vnode: any, container: any) {
    mountElement(vnode, container)
}

// 挂载elememt
function mountElement(vnode: any, container: any) {
    const { children, props, type } = vnode
    // type = div p span
    const el = document.createElement(type)

    if (typeof children === 'string') {
        el.textContent = children
    } else if (Array.isArray(children)) {
        mountChildren(vnode, el)
    }

    for (let key in props) {
        const val = props[key]
        el.setAttribute(key, val)
    }
    container.append(el)
}

// 处理子节点
function mountChildren(vnode: any, container: any) {
    vnode.children.forEach(element => {
        // 递归处理子节点
        patch(element, container)
    });
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

