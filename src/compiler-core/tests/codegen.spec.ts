import { genreate } from "../src/codegen"
import { baseParse } from "../src/parse"
import { transform } from "../src/transform"
import { transformExpression } from "../src/transforms/transformExpression"

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
})