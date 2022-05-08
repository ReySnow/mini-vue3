
// 创建组件实例
export function createComponentInstance(vnode) {
    const component = {
        vnode,
        type: vnode.type// 方便直接从实例上取类型
    }

    return component
}

export function setupComponent(instance) {
    // initprops
    // initSlots

    setupStatefulComponent(instance)
}

function setupStatefulComponent(instance: any) {
    const component = instance.type
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

