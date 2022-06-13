
export function transform(root, options) {
    const context = createTransformContext(root, options)
    transformNode(root, context)
}

function transformNode(node: any, context) {
    // if (node.type === NodeTypes.TEXT) {
    //     node.content = node.content + ' mini-vue'
    // }
    // 通过外部传入的options实现对节点的处理，扩展性高
    const nodeTransforms = context.nodeTransforms
    for (let i = 0; i < nodeTransforms.length; i++) {
        const transform = nodeTransforms[i];
        transform(node)
    }
    traverseChildren(node, context)
}

function traverseChildren(node: any, context: any) {
    const children = node.children
    if (children) {
        for (let item of children) {
            transformNode(item, context)
        }
    }
}

function createTransformContext(root: any, options: any) {
    const context = {
        root,
        nodeTransforms: options?.nodeTransforms || []
    }
    return context;
}
