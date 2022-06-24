import { isString } from "../../shared"
import { NodeTypes } from "./ast"
import { CREAETE_ELEMENT_VNODE, helperMapNames, TO_DISPLAY_STRING } from "./runtimeHelpers"

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
            break;
        case NodeTypes.ELEMENT:
            genElement(node, context)
            break;
        case NodeTypes.COMPOUND_EXPRESSION:
            genCompoundExpression(node, context)
            break;
        default:
            break;
    }
}

// 处理组合类型的节点
function genCompoundExpression(node: any, context: any) {
    const { push } = context
    const { children } = node
    for (let item of children) {
        if (isString(item)) {
            push(item)
        } else {
            genNode(item, context)
        }
    }
}

// 处理节点类型
function genElement(node, context) {
    const { push, helper } = context
    const { tag, children, props } = node
    push(`${helper(CREAETE_ELEMENT_VNODE)}('${tag}', ${props || 'null'}, `)
    for (let item of children) {
        genNode(item, context)
    }
    push(')')
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
