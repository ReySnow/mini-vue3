export * from './runtime-dom'
import { baseCompiler } from './compiler-core/src'
/**
 * 依赖关系
 *     -> compiler
 * vue 
 *     -> runtime-dom -> runtime-core -> reactivity
 */


import * as runtimeDom from './runtime-dom'
import { registerRuntimeCompiler } from './runtime-dom'

function compileToFunction(template) {
    const { code } = baseCompiler(template)
    const render = new Function("Vue", code)(runtimeDom)
    return render
}

// 将 compiler 传入到 runtime-core component 中 
// runtime-core 不依赖于compiler-core
registerRuntimeCompiler(compileToFunction)
