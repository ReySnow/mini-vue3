import { effect } from "../reactivity";
import { EMPTY_OBJ } from "../shared";
import { createComponentInstance, setupComponent } from "./component"
import { createAppAPI } from "./createApp";
import { shapeFlags } from "./shapeFlags"
import { Fragment, Text } from "./vnode";

export function createRenderer(options) {
    // 根据不同的平台传入对应的创建元素，插入元素，处理props 方法
    const {
        createElement: HostCreateElement,
        patchProp: HostPatchProp,
        insert: hostInsert,
        remove: hostRemove,
        setElementText: hostSetElementText
    } = options

    function render(vnode, container: any) {
        // 递归处理
        patch(null, vnode, container, null)
    }

    // n1老的 n2新的
    function patch(n1, n2: any, container: any, parentComponent: any) {
        // 判断vnode类型 component element
        const { shapeFlag, type } = n2
        switch (type) {
            case Fragment:
                processFragment(n1, n2, container, parentComponent);
                break;
            case Text:
                processText(n1, n2, container);
                break;
            default:
                if (shapeFlag & shapeFlags.ELELEMT) {
                    processElement(n1, n2, container, parentComponent)
                } else if (shapeFlag & shapeFlags.STATEFUL_COMPONENT) {
                    processComponent(n1, n2, container, parentComponent)
                }
        }
    }

    // 处理fragment，只渲染children
    function processFragment(n1, n2: any, container: any, parentComponent) {
        mountChildren(n2.children, container, parentComponent)
    }

    // 渲染text文本
    function processText(n1, n2: any, container: any) {
        const { children } = n2
        const textNode = n2.el = document.createTextNode(children)
        container.append(textNode)
    }

    // 处理类型为element的vnode
    function processElement(n1, n2: any, container: any, parentComponent) {
        if (!n1) {
            mountElement(n2, container, parentComponent)
        } else {
            patchElement(n1, n2, container, parentComponent)
        }
    }

    function patchElement(n1, n2, container, parentComponent) {
        console.log('patchElement', n1, n2);
        let oldProps = n1.props || EMPTY_OBJ
        let newProps = n2.props || EMPTY_OBJ
        // 此时n2没有el
        let el = n2.el = n1.el
        patchProps(el, oldProps, newProps)
        patchChildren(n1, n2, el, parentComponent)
    }

    function patchChildren(n1, n2, container, parentComponent) {
        const { shapeFlag: prevShapeFlag, children: c1 } = n1
        const { shapeFlag, children: c2 } = n2
        // 新的是文本节点
        if (shapeFlag & shapeFlags.TEXT_CHILDREN) {
            if (prevShapeFlag & shapeFlags.ARRAY_CHILDREND) {
                // 数组 => 文本 先删除数组中的元素
                unMountChildren(c1)
            }
            if (c1 !== c2) {
                // 设置新的文本
                hostSetElementText(container, c2)
            }
        } else {
            // 新的是数组
            if (prevShapeFlag & shapeFlags.TEXT_CHILDREN) {
                // 文本转数组, 先清空文本， 挂载数组
                hostSetElementText(container, '')
                console.log(parentComponent);

                mountChildren(c2, container, parentComponent)
            }
        }
    }

    function unMountChildren(children) {
        for (let item of children) {
            let el = item.el
            hostRemove(el)
        }
    }

    // 更新props
    function patchProps(el, oldProps, newProps) {
        if (oldProps !== newProps) {
            for (const key in newProps) {
                const prevProp = oldProps[key]
                const nextProp = newProps[key]
                if (prevProp !== nextProp) {
                    HostPatchProp(el, key, prevProp, nextProp)
                }
            }

            if (oldProps !== EMPTY_OBJ) {
                for (const key in oldProps) {
                    // 新的props中没有这个属性， 删除
                    if (!(key in newProps)) {
                        HostPatchProp(el, key, oldProps[key], null)
                    }
                }
            }
        }
    }

    // 挂载elememt
    function mountElement(vnode: any, container: any, parentComponent) {
        const { children, props, type, shapeFlag } = vnode
        // type = div p span  赋值给vnode.el -> this.$el 取值
        // const el = vnode.el = document.createElement(type)
        const el = vnode.el = HostCreateElement(type)

        if (shapeFlag & shapeFlags.TEXT_CHILDREN) {
            el.textContent = children
        } else if (shapeFlag & shapeFlags.ARRAY_CHILDREND) {
            mountChildren(vnode.children, el, parentComponent)
        }

        for (let key in props) {
            const val = props[key]
            // const isOn = (key: string) => /^on[A-Z]/.test(key)
            // if (isOn(key)) {
            //     const even = key.slice(2).toLocaleLowerCase()
            //     el.addEventListener(even, val)
            // } else {
            //     el.setAttribute(key, val)
            // }
            HostPatchProp(el, key, null, val)
        }
        // container.append(el)
        hostInsert(el, container)
    }

    // 处理子节点
    function mountChildren(children: any, container: any, parentComponent) {
        children.forEach(element => {
            // 递归处理子节点
            patch(null, element, container, parentComponent)
        });
    }

    // 处理类型为component的vnode
    function processComponent(n1, n2: any, container: any, parentComponent) {
        mountComponent(n2, container, parentComponent)
    }

    // 挂载component
    function mountComponent(initialVNode: any, container: any, parentComponent) {
        // 创建组件实例
        const instance = createComponentInstance(initialVNode, parentComponent)

        setupComponent(instance)
        setupRenderEffect(instance, initialVNode, container)
    }

    function setupRenderEffect(instance, initialVNode, container) {
        // finishComponent 中设置了render
        // subtree 就是虚拟节点
        // 将proxy绑定到this上
        // 组件的render函数会使用响应式对象 this.xxxx 此时会收集依赖
        // 当响应式对象发生改变的时候会在次执行
        effect(() => {
            if (!instance.isMounleted) {
                const { proxy } = instance
                const subTree = instance.subTree = instance.render.call(proxy)

                patch(null, subTree, container, instance)

                initialVNode.el = subTree.el

                instance.isMounleted = true
            } else {
                console.log('update');
                const { proxy } = instance
                const subTree = instance.render.call(proxy)
                const prevSubTree = instance.subTree
                instance.subTree = subTree
                patch(prevSubTree, subTree, container, instance)

            }
        })
    }

    return {
        createApp: createAppAPI(render)
    }
}
