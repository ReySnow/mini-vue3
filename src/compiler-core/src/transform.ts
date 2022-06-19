import { NodeTypes } from "./ast"
import { TO_DISPLAY_STRING } from "./runtimeHelpers"

export function transform(root, options = {}) {
    const context = createTransformContext(root, options)
    transformNode(root, context)
    creteRootCodegen(root)

    // 将节点需要的方法放到节点上， 在生成 code 的时候使用
    root.helpers = [...context.helpers.keys()]
}

function creteRootCodegen(root: any) {
    let child = root.children[0]
    if (child.type === NodeTypes.ELEMENT) {
        root.codegenNode = child.codegenNode
    } else {
        root.codegenNode = root.children[0]
    }
}

function transformNode(node: any, context) {
    // if (node.type === NodeTypes.TEXT) {
    //     node.content = node.content + ' mini-vue'
    // }
    // 通过外部传入的options实现对节点的处理，扩展性高
    // 进入时执行
    const nodeTransforms = context.nodeTransforms
    const exitFns: any = []
    for (let i = 0; i < nodeTransforms.length; i++) {
        const transform = nodeTransforms[i];
        const onExit = transform(node, context)
        if (onExit) {
            exitFns.push(onExit)
        }
    }

    // 处理节点
    switch (node.type) {
        case NodeTypes.INTERPOLATION:
            // 当为插值时添加插值对应的方法
            context.helper(TO_DISPLAY_STRING)
            break;
        case NodeTypes.ROOT:
        case NodeTypes.ELEMENT:
            traverseChildren(node, context)
            break
        default:
            break;
    }

    // 有的需要在退出时执行
    let i = exitFns.length
    while (i--) {
        exitFns[i]()
    }
}

function traverseChildren(node: any, context: any) {
    const children = node.children
    for (let item of children) {
        transformNode(item, context)
    }
}

function createTransformContext(root: any, options: any) {
    const context = {
        root,
        nodeTransforms: options?.nodeTransforms || [],
        helpers: new Map(),// 保存 xxx const {xxx}=Vue
        helper(key) {
            context.helpers.set(key, 1)
        }
    }
    return context;
}
