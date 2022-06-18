import { NodeTypes } from "./ast"

const enum TagTypes {
    Start,
    End
}

export function baseParse(content) {
    const context = createParseContext(content)
    return createRoot(parseChildren(context, []))
}

function parseChildren(context, ancestors) {
    const nodes: any[] = []
    while (!isEnded(context, ancestors)) {
        let node
        let s = context.source
        if (s.startsWith('{{')) {
            node = paresInterpolation(context)
        } else if (s[0] === '<') {
            if (/[a-z]/i.test(s[1])) {
                node = parseElement(context, ancestors)
            }
        }

        if (!node) {
            node = parseText(context)
        }
        nodes.push(node)
    }
    return nodes
}

// 判断是否结束
function isEnded(context, ancestors) {
    let s = context.source
    if (s.startsWith('</')) {
        // 只要遇到结束标签就结束  从开始标签里面找
        for (let i = ancestors.length - 1; i >= 0; i--) {
            if (startsWithEndTagOpen(s, ancestors[i].tag)) {
                return true
            }
        }
    }
    // 没有需要解析的了
    return !s
}

function parseText(context: any): any {
    let endIndex = context.source.length
    let endTokens = ['{{', '<']// 解析text结束标识
    for (let item of endTokens) {
        let index = context.source.indexOf(item)
        if (index !== -1 && index < endIndex) {
            endIndex = index
        }
    }

    const content = parseTextData(context, endIndex)

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

function parseElement(context: any, ancestors): any {
    const element: any = parseTag(context, TagTypes.Start)
    ancestors.push(element)
    element.children = parseChildren(context, ancestors)

    // 判断结束标签是否与开始标签一样
    if (startsWithEndTagOpen(context.source, element.tag)) {
        ancestors.pop()
        parseTag(context, TagTypes.End)
    } else {
        throw new Error(`缺少结束标签:${element.tag}`)
    }

    return element
}

function startsWithEndTagOpen(source, tag) {
    return source.startsWith('</')
        && source.slice(2, 2 + tag.length).toLowerCase() === tag.toLowerCase()
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
        children,
        type: NodeTypes.ROOT
    }
}

function createParseContext(content: string) {
    return {
        source: content
    }
}
