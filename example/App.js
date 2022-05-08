import { h } from "../lib/mini-vue.esm.js"

window.self = null
export const App = {
    setup() {
        return {
            msg: 'nihao'
        }
    },
    render() {
        window.self = this
        return h(
            'div',
            {
                id: 'root',
                class: 'red'
            },
            'hi, ' + this.msg
            // [
            //     h('p', { class: 'red' }, 'hi'),
            //     h('p', { class: 'blue' }, 'mini-vue'),
            // ]
        )
    }
}
