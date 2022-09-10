import { isArray } from "@mini-vue/shared"
import { shapeFlags } from "./shapeFlags"

// 初始化slots
export function initSlots(instance, children) {
    const { vnode } = instance
    if (vnode.shapeFlag & shapeFlags.SLOT_CHILDREN) {
        normalizeObjectSlots(instance.slots, children)
    }
}

// 给slots赋值
function normalizeObjectSlots(slots: any, children: any) {
    for (let key in children) {
        const value = children[key]
        // slot 是个函数
        slots[key] = (props) => normalizeSlotValue(value(props))
    }
}

function normalizeSlotValue(value: any) {
    return isArray(value) ? value : [value]
}

