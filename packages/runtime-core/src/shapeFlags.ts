export const enum shapeFlags {
    ELELEMT = 1,
    STATEFUL_COMPONENT = 1 << 1,
    TEXT_CHILDREN = 1 << 2,
    ARRAY_CHILDREND = 1 << 3,
    SLOT_CHILDREN = 1 << 4, // children 是不是插槽类型
}
