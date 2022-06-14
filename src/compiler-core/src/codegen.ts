
export function genreate(ast) {
    const context = createCodegenContext()
    const { push } = context
    push('return ')

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

function genNode(node, context: any) {
    const { push } = context
    push(node.content)
}

// 创建上下文对象
function createCodegenContext(): any {
    const context = {
        code: '',
        push(source) {
            context.code += source
        }
    }
    return context
}
