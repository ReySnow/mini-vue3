import { genreate } from "../src/codegen"
import { baseParse } from "../src/parse"
import { transform } from "../src/transform"

describe('codegen', () => {
    it('string', () => {
        const ast = baseParse('hi')
        transform(ast)
        const { code } = genreate(ast)
        expect(code).toMatchSnapshot()
    })
})