import { isObject } from "../shared/index"
import { createComponentInstance, setupComponent } from "./component"
import { shapeFlags } from "./shapeFlags"

export function render(vnode, container: any) {
    // 递归处理
    patch(vnode, container)
}

function patch(vnode: any, container: any) {
    // 判断vnode类型 component element
    const { shapeFlag } = vnode
    if (shapeFlag & shapeFlags.ELELEMT) {
        processElement(vnode, container)
    } else if (shapeFlag & shapeFlags.STATEFUL_COMPONENT) {
        processComponent(vnode, container)
    }
}

// 处理类型为element的vnode
function processElement(vnode: any, container: any) {
    mountElement(vnode, container)
}

// 挂载elememt
function mountElement(vnode: any, container: any) {
    const { children, props, type, shapeFlag } = vnode
    // type = div p span
    const el = vnode.el = document.createElement(type)

    if (shapeFlag & shapeFlags.TEXT_CHILDREN) {
        el.textContent = children
    } else if (shapeFlag & shapeFlags.ARRAY_CHILDREND) {
        mountChildren(vnode, el)
    }

    for (let key in props) {
        const val = props[key]
        const isOn = (key: string) => /^on[A-Z]/.test(key)
        if (isOn(key)) {
            const even = key.slice(2).toLocaleLowerCase()
            el.addEventListener(even, val)
        } else {
            el.setAttribute(key, val)
        }
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
    // 将proxy绑定到this上
    const subtree = instance.render.call(instance.proxy)
    patch(subtree, container)

    instance.vnode.el = subtree.el
}

