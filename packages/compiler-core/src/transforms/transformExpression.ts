import { NodeTypes } from "../ast";

export function transformExpression(node) {
    if (node.type === NodeTypes.INTERPOLATION) {
        procesExpression(node.content)
    }
}

function procesExpression(node: any) {
    node.content = `_ctx.${node.content}`
}
