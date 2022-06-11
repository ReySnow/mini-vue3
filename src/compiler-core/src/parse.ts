import { NodeTypes } from "./ast"

const enum TagTypes {
    Start,
    End
}

export function baseParse(content) {
    const context = createParseContext(content)
    return createRoot(parseChildren(context))
}

function parseChildren(context) {
    const nodes: any[] = []
    let node
    let s = context.source
    if (s.startsWith('{{')) {
        node = paresInterpolation(context)
    } else if (s[0] === '<') {
        node = parseElement(context)
    }

    if (!node) {
        node = parseText(context)
    }

    nodes.push(node)
    return nodes
}

function parseText(context: any): any {
    const content = parseTextData(context, context.source.length)
    return {
        type: NodeTypes.TEXT,
        content
    }
}

function parseTextData(context, length) {
    const content = context.source.slice(0, length)
    advanceBy(context, length)
    return content
}

function parseElement(context: any): any {
    const element = parseTag(context, TagTypes.Start)
    parseTag(context, TagTypes.End)

    return element
}

function parseTag(context, type) {
    const match: any = /^\<\/?([a-z]*)/i.exec(context.source)
    const tag = match[1]

    advanceBy(context, match[0].length)
    advanceBy(context, 1)// >右尖括号

    if (type === TagTypes.End) return

    return {
        type: NodeTypes.ELEMENT,
        tag
    }
}


function paresInterpolation(context) {
    const openDelimiter = '{{'
    const closeDelimiter = '}}'
    const closeIndex = context.source.indexOf(closeDelimiter, openDelimiter.length)

    // 去除开始部分
    advanceBy(context, openDelimiter.length)

    const rawContentLength = closeIndex - openDelimiter.length
    const rawContent = parseTextData(context, rawContentLength)
    const content = rawContent.trim()

    // 去除结束部分 }}
    advanceBy(context, closeDelimiter.length)

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
