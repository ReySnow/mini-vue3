import { NodeTypes } from "./ast"
import { helperMapNames, TO_DISPLAY_STRING } from "./runtimeHelpers"

export function genreate(ast) {
    const context = createCodegenContext()
    const { push } = context

    genFunctionPreamble(ast, context)

    const functionName = 'render'
    const args = ['_ctx', '_catch']

    push(`function ${functionName}(${args.join(', ')}){`)
    push('return ')
    genNode(ast.codegenNode, context)
    push('}')
    return {
        code: context.code
    }
}

// 处理开头导入部分
function genFunctionPreamble(ast: any, context: any) {
    const { push } = context
    const VueBinging = 'Vue'
    // 别名
    const aliasHelper = s => `${helperMapNames[s]}: _${helperMapNames[s]}`
    if (ast.helpers.length > 0) {
        push(`const { ${ast.helpers.map(aliasHelper).join(', ')} } = ${VueBinging}`)
        push('\n')
    }
    push('return ')
}

// 处理节点
function genNode(node, context: any) {
    switch (node.type) {
        case NodeTypes.TEXT:
            genText(node, context)
            break;
        case NodeTypes.INTERPOLATION:
            genInterpolation(node, context)
            break;
        case NodeTypes.SIMPLE_EXPRESSION:
            genExpression(node, context)
            break
        default:
            break;
    }
}

// 处理插值中的表达式 此时已经被transform处理过了
function genExpression(node: any, context: any) {
    const { push } = context
    push(`${node.content}`)
}

// 处理插值
function genInterpolation(node: any, context: any) {
    const { push, helper } = context
    push(`${helper(TO_DISPLAY_STRING)}(`)
    genNode(node.content, context)
    push(')')
}

function genText(node: any, context: any) {
    const { push } = context
    push(`'${node.content}'`)
}

// 创建上下文对象
function createCodegenContext(): any {
    const context = {
        code: '',
        push(source) {
            context.code += source
        },
        helper(key) {
            return `_${helperMapNames[key]}`
        }
    }
    return context
}
