import typescript from "@rollup/plugin-typescript"
export default {
    input: './packages/vue/src/index.ts',
    output: [
        // commonjs
        {
            format: 'cjs',
            file: 'packages/vue/dist/mini-vue.cjs.js'
        },
        // esm
        {
            format: 'es',
            file: 'packages/vue/dist/mini-vue.esm.js'
        }
    ],
    plugins: [
        typescript()
    ]
}
