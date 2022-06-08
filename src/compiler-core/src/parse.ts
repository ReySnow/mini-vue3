import { NodeTypes } from "./ast"

export function baseParse(content) {
    const context = createParseContext(content)
    return createRoot(parseChildren(context))
}

function parseChildren(context) {
    const nodes: any[] = []
    let node
    if (context.source.startsWith('{{')) {
        node = paresInterpolation(context)
    }
    nodes.push(node)
    return nodes
}

function paresInterpolation(context) {
    const openDelimiter = '{{'
    const closeDelimiter = '}}'
    const closeIndex = context.source.indexOf(closeDelimiter, openDelimiter.length)

    // 去除开始部分
    advanceBy(context, openDelimiter.length)

    const rawContentLength = closeIndex - openDelimiter.length
    const rawContent = context.source.slice(0, rawContentLength)
    const content = rawContent.trim()

    // 去除结束部分 xxx}}
    advanceBy(context, rawContentLength + closeDelimiter.length)

    return {
        type: NodeTypes.INTERPOLATION,
        content: {
            type: NodeTypes.SIMPLE_EXPRESSION,
            content: content,
        }
    }
}

// 剪切 向前推
function advanceBy(context, length) {
    context.source = context.source.slice(length)
}

function createRoot(children) {
    return {
        children
    }
}

function createParseContext(content: string) {
    return {
        source: content
    }
}
