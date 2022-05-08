import { publicInstanceHandlers } from "./componentPublicInstance"

// 创建组件实例
export function createComponentInstance(vnode) {
    const instance = {
        vnode,
        type: vnode.type,// 方便直接从实例上取类型
        setupState: {}// 保存状态 setup 返回值
    }

    return instance
}

export function setupComponent(instance) {
    // initprops
    // initSlots

    setupStatefulComponent(instance)
}

function setupStatefulComponent(instance: any) {
    const component = instance.type

    // render 的 ctx 
    // 通过代理对象取值实现在 render 中通过 this.xx 取值
    instance.proxy = new Proxy({ _: instance }, publicInstanceHandlers)


    const { setup } = component
    if (setup) {
        // setup 返回对象或函数
        const setupResult = setup()

        handleSetupResult(instance, setupResult)
    }
}

function handleSetupResult(instance, setupResult) {
    if (typeof setupResult === 'object') {
        instance.setupState = setupResult
    }

    finishComponent(instance)
}

function finishComponent(instance: any) {
    const component = instance.type

    if (component.render) {
        instance.render = component.render
    }
}
