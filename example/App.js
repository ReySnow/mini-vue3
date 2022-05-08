import { h } from "../lib/mini-vue.esm"

export const App = {
    setup() {
        return {
            msg: 'nihao'
        }
    },
    render() {
        return h('div', 'hi' + this.msg)
    }
}
