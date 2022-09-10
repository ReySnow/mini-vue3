import { proxyRefs, shallowReadonly } from "@mini-vue/reactivity"
import { emit } from "./componentEmit"
import { initprops } from "./componentProps"
import { publicInstanceHandlers } from "./componentPublicInstance"
import { initSlots } from "./componentSlots"

let currentInstance = null

// 创建组件实例
export function createComponentInstance(vnode, parent) {
    const instance = {
        vnode,
        type: vnode.type,// 方便直接从实例上取类型
        setupState: {},// 保存状态 setup 返回值
        props: {},
        next: null,// 下次需要更新的虚拟节点
        emit: () => { },
        slots: {},
        // 使用父级的来初始化 原形链 provide-inject 功能
        provides: parent ? Object.create(parent.provides) : {},
        parent,
        isMounleted: false,
        subTree: {}
    }

    instance.emit = emit.bind(null, instance) as any

    return instance
}

export function setupComponent(instance) {
    // 初始化props
    initprops(instance, instance.vnode.props)
    // 初始化插槽
    initSlots(instance, instance.vnode.children)

    setupStatefulComponent(instance)
}

// 调用组件的setup方法，传递props，将setup返回值赋值到组件的instance上
function setupStatefulComponent(instance: any) {
    const component = instance.type

    // render 的 ctx 
    // 通过代理对象取值实现在 render 中通过 this.xx 取值
    instance.proxy = new Proxy({ _: instance }, publicInstanceHandlers)

    const { setup } = component
    if (setup) {
        // 获取组件实例只能在setup函数中执行
        setCurrentInstance(instance)
        // setup 返回对象或函数
        const setupResult = setup(shallowReadonly(instance.props), {
            emit: instance.emit,
        })
        setCurrentInstance(null)

        handleSetupResult(instance, setupResult)
    }
}

function handleSetupResult(instance, setupResult) {
    if (typeof setupResult === 'object') {
        // proxyRefs 使render中的ref可以直接取值
        instance.setupState = proxyRefs(setupResult)
    }

    finishComponent(instance)
}

function finishComponent(instance: any) {
    const component = instance.type

    if (compiler && !component.render) {
        if (component.template) {
            // 通过compiler生成render函数
            component.render = compiler(component.template)
        }
    }
    if (component.render) {
        instance.render = component.render
    }
}

function setCurrentInstance(instance: any) {
    currentInstance = instance
}

export function getCurrentInstance() {
    return currentInstance
}

let compiler;
// 将compile传入进来 一开始的时候就会自动生成
export function registerRuntimeCompiler(_compiler) {
    compiler = _compiler
}