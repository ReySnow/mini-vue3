import { NodeTypes } from "../src/ast"
import { baseParse } from "../src/parse"

describe('parse', () => {
    describe('interpolation', () => {
        test('simple interpolation', () => {
            const ast = baseParse('{{message}}')

            expect(ast.children[0]).toStrictEqual({
                type: NodeTypes.INTERPOLATION,
                content: {
                    type: NodeTypes.SIMPLE_EXPRESSION,
                    content: "message",
                }
            })
        })
    })

    describe('element', () => {
        test('element div', () => {
            const ast = baseParse('<div></div>')

            expect(ast.children[0]).toStrictEqual({
                type: NodeTypes.ELEMENT,
                tag: 'div',
                children: []
            })
        })
    })
    describe('text', () => {
        test('text', () => {
            const ast = baseParse('text')

            expect(ast.children[0]).toStrictEqual({
                type: NodeTypes.TEXT,
                content: 'text'
            })
        })
    })

    test('happy path', () => {
        const ast = baseParse('<div>hi,{{message}}</div>')
        expect(ast.children[0]).toStrictEqual({
            type: NodeTypes.ELEMENT,
            tag: 'div',
            children: [
                {
                    type: NodeTypes.TEXT,
                    content: 'hi,'
                },
                {
                    type: NodeTypes.INTERPOLATION,
                    content: {
                        type: NodeTypes.SIMPLE_EXPRESSION,
                        content: "message",
                    }
                }
            ]
        })
    })

    test('Nested element', () => {
        const ast = baseParse('<div><p>hi</p>{{message}}</div>')

        expect(ast.children[0]).toStrictEqual({
            type: NodeTypes.ELEMENT,
            tag: 'div',
            children: [
                {
                    type: NodeTypes.ELEMENT,
                    tag: 'p',
                    children: [
                        {
                            type: NodeTypes.TEXT,
                            content: 'hi'
                        },
                    ]
                },
                {
                    type: NodeTypes.INTERPOLATION,
                    content: {
                        type: NodeTypes.SIMPLE_EXPRESSION,
                        content: "message",
                    }
                }
            ]
        })
    })

    test('should throw error', () => {
        // baseParse('<div><span></div>')
        expect(() => {
            baseParse('<div><span></div>')
        }).toThrow(`缺少结束标签:span`)
    })
})