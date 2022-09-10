import { genreate } from "../src/codegen"
import { baseParse } from "../src/parse"
import { transform } from "../src/transform"
import { transformELement } from "../src/transforms/transformElement"
import { transformExpression } from "../src/transforms/transformExpression"
import { transformText } from "../src/transforms/transformText"

describe('codegen', () => {
    it('string', () => {
        const ast = baseParse('hi')
        transform(ast)
        const { code } = genreate(ast)
        expect(code).toMatchSnapshot()
    })

    it('should interpolation', () => {
        const ast = baseParse('{{message}}')
        transform(ast, {
            nodeTransforms: [transformExpression]
        })
        const { code } = genreate(ast)
        expect(code).toMatchSnapshot()
    })

    it('should element', () => {
        const ast = baseParse('<div>hi,{{message}}</div>')
        transform(ast, {
            // 执行顺序 transformExpression  transformText  transformELement
            nodeTransforms: [transformExpression, transformELement, transformText]
        })
        const { code } = genreate(ast)
        expect(code).toMatchSnapshot()
    })
})