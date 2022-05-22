import { createComponentInstance, setupComponent } from "./component"
import { shapeFlags } from "./shapeFlags"
import { Fragment, Text } from "./vnode";

export function render(vnode, container: any) {
    // 递归处理
    patch(vnode, container, null)
}

function patch(vnode: any, container: any, parentCompontent: any) {
    // 判断vnode类型 component element
    const { shapeFlag, type } = vnode
    switch (type) {
        case Fragment:
            processFragment(vnode, container, parentCompontent);
            break;
        case Text:
            processText(vnode, container);
            break;
        default:
            if (shapeFlag & shapeFlags.ELELEMT) {
                processElement(vnode, container, parentCompontent)
            } else if (shapeFlag & shapeFlags.STATEFUL_COMPONENT) {
                processComponent(vnode, container, parentCompontent)
            }
    }
}

// 处理fragment，只渲染children
function processFragment(vnode: any, container: any, parentCompontent) {
    mountChildren(vnode, container, parentCompontent)
}

// 渲染text文本
function processText(vnode: any, container: any) {
    const { children } = vnode
    const textNode = vnode.el = document.createTextNode(children)
    container.append(textNode)
}

// 处理类型为element的vnode
function processElement(vnode: any, container: any, parentCompontent) {
    mountElement(vnode, container, parentCompontent)
}

// 挂载elememt
function mountElement(vnode: any, container: any, parentCompontent) {
    const { children, props, type, shapeFlag } = vnode
    // type = div p span  赋值给vnode.el -> this.$el 取值
    const el = vnode.el = document.createElement(type)

    if (shapeFlag & shapeFlags.TEXT_CHILDREN) {
        el.textContent = children
    } else if (shapeFlag & shapeFlags.ARRAY_CHILDREND) {
        mountChildren(vnode, el, parentCompontent)
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
function mountChildren(vnode: any, container: any, parentCompontent) {
    vnode.children.forEach(element => {
        // 递归处理子节点
        patch(element, container, parentCompontent)
    });
}

// 处理类型为component的vnode
function processComponent(vnode: any, container: any, parentCompontent) {
    mountComponent(vnode, container, parentCompontent)
}

// 挂载component
function mountComponent(vnode: any, container: any, parentCompontent) {
    // 创建组件实例
    const instance = createComponentInstance(vnode, parentCompontent)

    setupComponent(instance)
    setupRenderEffect(instance, container)
}

function setupRenderEffect(instance, container) {
    // finishComponent 中设置了render
    // subtree 就是虚拟节点
    // 将proxy绑定到this上
    const subtree = instance.render.call(instance.proxy)
    patch(subtree, container, instance)

    instance.vnode.el = subtree.el
}

