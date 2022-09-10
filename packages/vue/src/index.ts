export * from '@mini-vue/runtime-dom'
import { baseCompiler } from '@mini-vue/compiler-core'
/**
 * 依赖关系
 *     -> compiler
 * vue 
 *     -> runtime-dom -> runtime-core -> reactivity
 */


import * as runtimeDom from '@mini-vue/runtime-dom'
import { registerRuntimeCompiler } from '@mini-vue/runtime-dom'

function compileToFunction(template) {
    const { code } = baseCompiler(template)
    const render = new Function("Vue", code)(runtimeDom)
    return render
}

// 将 compiler 传入到 runtime-core component 中 
// runtime-core 不依赖于compiler-core
registerRuntimeCompiler(compileToFunction)
