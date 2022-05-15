import { hasOwn } from "../shared/index"

const publicPropertiesMap = {
    $el: i => i.vnode.el
}

export const publicInstanceHandlers = {
    get({ _: instance }, key) {
        // 处理this取值
        const { setupState, props } = instance

        if (hasOwn(setupState, key)) {
            return setupState[key]
        } else if (hasOwn(props, key)) {
            return props[key]
        }

        const publicGetter = publicPropertiesMap[key]
        if (publicGetter) {
            return publicGetter(instance)
        }
    }
}
