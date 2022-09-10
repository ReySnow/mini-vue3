import { camelize, toHandlerKey } from "@mini-vue/shared"

export function emit(instance, event, ...arg) {
    const { props } = instance

    const handlerName = toHandlerKey(camelize(event))
    const handler = props[handlerName]
    handler && handler(...arg)
}
