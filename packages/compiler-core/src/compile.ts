import { genreate } from "./codegen"
import { baseParse } from "./parse"
import { transform } from "./transform"
import { transformELement } from "./transforms/transformElement"
import { transformExpression } from "./transforms/transformExpression"
import { transformText } from "./transforms/transformText"

export function baseCompiler(template) {
    const ast = baseParse(template)
    transform(ast, {
        // 执行顺序 transformExpression  transformText  transformELement
        nodeTransforms: [transformExpression, transformELement, transformText]
    })
    return genreate(ast)
}