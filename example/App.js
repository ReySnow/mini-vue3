import { h } from "../lib/mini-vue.esm.js"
import { Foo } from './Foo.js'

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
                class: 'red',
                onClick() {
                    console.log('click');
                },
                onMousedown() {
                    console.log('mousedown');
                }
            },
            [
                h('p', { class: 'red' }, 'hi, ' + this.msg),
                h(Foo, { count: 1 })
            ]
        )
    }
}
