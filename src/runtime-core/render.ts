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
        patch(null, vnode, container, null, null)
    }

    // n1老的 n2新的
    function patch(n1, n2: any, container: any, parentComponent: any, anchor) {
        // 判断vnode类型 component element
        const { shapeFlag, type } = n2
        switch (type) {
            case Fragment:
                processFragment(n1, n2, container, parentComponent, anchor);
                break;
            case Text:
                processText(n1, n2, container);
                break;
            default:
                if (shapeFlag & shapeFlags.ELELEMT) {
                    processElement(n1, n2, container, parentComponent, anchor)
                } else if (shapeFlag & shapeFlags.STATEFUL_COMPONENT) {
                    processComponent(n1, n2, container, parentComponent, anchor)
                }
        }
    }

    // 处理fragment，只渲染children
    function processFragment(n1, n2: any, container: any, parentComponent, anchor) {
        mountChildren(n2.children, container, parentComponent, anchor)
    }

    // 渲染text文本
    function processText(n1, n2: any, container: any) {
        const { children } = n2
        const textNode = n2.el = document.createTextNode(children)
        container.append(textNode)
    }

    // 处理类型为element的vnode
    function processElement(n1, n2: any, container: any, parentComponent, anchor) {
        if (!n1) {
            mountElement(n2, container, parentComponent, anchor)
        } else {
            patchElement(n1, n2, container, parentComponent, anchor)
        }
    }

    function patchElement(n1, n2, container, parentComponent, anchor) {
        console.log('patchElement', n1, n2);
        let oldProps = n1.props || EMPTY_OBJ
        let newProps = n2.props || EMPTY_OBJ
        // 此时n2没有el
        let el = n2.el = n1.el
        patchProps(el, oldProps, newProps)
        patchChildren(n1, n2, el, parentComponent, anchor)
    }

    function patchChildren(n1, n2, container, parentComponent, anchor) {
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
                mountChildren(c2, container, parentComponent, anchor)
            } else {
                patchKeyedChildren(c1, c2, container, parentComponent, anchor)
            }
        }
    }

    function patchKeyedChildren(c1, c2, container, parentComponent, parentAnchor) {
        let l2 = c2.length
        let e1 = c1.length - 1
        let e2 = l2 - 1
        let i = 0

        function isSameVnodeType(n1, n2) {
            return n1.type === n2.type && n1.key === n2.key
        }

        // 左端
        while (i <= e1 && i <= e2) {
            let n1 = c1[i]
            let n2 = c2[i]
            if (isSameVnodeType(n1, n2)) {
                patch(n1, n2, container, parentComponent, parentAnchor)
            } else {
                break
            }
            i++
        }

        // 右端
        while (i <= e1 && i <= e2) {
            let n1 = c1[e1]
            let n2 = c2[e2]
            if (isSameVnodeType(n1, n2)) {
                patch(n1, n2, container, parentComponent, parentAnchor)
            } else {
                break
            }
            e1--
            e2--
        }
        console.log(i, e1, e2);
        // 新的比老的长 创建
        if (i > e1) {
            if (i <= e2) {
                let nextPos = e2 + 1
                let anchor = nextPos < l2 ? c2[nextPos].el : null
                console.log('nextPos', nextPos, anchor, l2);
                while (i <= e2) {
                    patch(null, c2[i], container, parentComponent, anchor)
                    i++
                }
            }
        } else if (i > e2) {
            // 老的比新的长 删除
            while (i <= e1) {
                hostRemove(c1[i].el)
                i++
            }
        } else {
            // 对比中间的
            let s1 = i
            let s2 = i
            const toBePatched = e2 - s2 + 1;// 需要被比较的
            let patched = 0
            // 将新的里面的按照 key->index 保存起来
            const keyToNewIndexMap = new Map()
            for (let i = s2; i <= e2; i++) {
                keyToNewIndexMap.set(c2[i].key, i)
            }
            for (let i = s1; i <= e1; i++) {
                const prevChild = c1[i]

                // 中间部分，老的比新的多， 那么多出来的直接就可以被干掉(优化删除逻辑)
                if (patched >= toBePatched) {
                    hostRemove(prevChild.el)
                    continue
                }

                let newIndex
                // 老的是否还在新的里面
                if (prevChild.key != null) {
                    newIndex = keyToNewIndexMap.get(prevChild.key)
                } else {
                    for (let j = s2; i <= e2; j++) {
                        if (isSameVnodeType(prevChild, c2[j])) {
                            newIndex = j
                            break
                        }
                    }
                }
                if (newIndex) {
                    patch(prevChild, c2[newIndex], container, parentComponent, null)
                    patched++
                } else {
                    hostRemove(prevChild.el)
                }
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
    function mountElement(vnode: any, container: any, parentComponent, anchor) {
        const { children, props, type, shapeFlag } = vnode
        // type = div p span  赋值给vnode.el -> this.$el 取值
        // const el = vnode.el = document.createElement(type)
        const el = vnode.el = HostCreateElement(type)

        if (shapeFlag & shapeFlags.TEXT_CHILDREN) {
            el.textContent = children
        } else if (shapeFlag & shapeFlags.ARRAY_CHILDREND) {
            mountChildren(vnode.children, el, parentComponent, anchor)
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
        hostInsert(el, container, anchor)
    }

    // 处理子节点
    function mountChildren(children: any, container: any, parentComponent, anchor) {
        children.forEach(element => {
            // 递归处理子节点
            patch(null, element, container, parentComponent, anchor)
        });
    }

    // 处理类型为component的vnode
    function processComponent(n1, n2: any, container: any, parentComponent, anchor) {
        mountComponent(n2, container, parentComponent, anchor)
    }

    // 挂载component
    function mountComponent(initialVNode: any, container: any, parentComponent, anchor) {
        // 创建组件实例
        const instance = createComponentInstance(initialVNode, parentComponent)

        setupComponent(instance)
        setupRenderEffect(instance, initialVNode, container, anchor)
    }

    function setupRenderEffect(instance, initialVNode, container, anchor) {
        // finishComponent 中设置了render
        // subtree 就是虚拟节点
        // 将proxy绑定到this上
        // 组件的render函数会使用响应式对象 this.xxxx 此时会收集依赖
        // 当响应式对象发生改变的时候会在次执行
        effect(() => {
            if (!instance.isMounleted) {
                const { proxy } = instance
                const subTree = instance.subTree = instance.render.call(proxy)

                patch(null, subTree, container, instance, anchor)

                initialVNode.el = subTree.el

                instance.isMounleted = true
            } else {
                console.log('update');
                const { proxy } = instance
                const subTree = instance.render.call(proxy)
                const prevSubTree = instance.subTree
                instance.subTree = subTree
                patch(prevSubTree, subTree, container, instance, anchor)

            }
        })
    }

    return {
        createApp: createAppAPI(render)
    }
}
