import { h } from "../lib/mini-vue.esm.js"
import { Foo } from './Foo.js'

window.self = null
export const App = {
    setup() {
        const onAdd = (a, b) => {
            console.log('add', a, b);
        }

        const onAddFoo = () => {
            console.log('foo');
        }
        return {
            msg: 'nihao',
            onAdd,
            onAddFoo
        }
    },
    render() {
        window.self = this
        return h(
            'div',
            {
                id: 'root',
                class: 'red',
            },
            [
                h('p', { class: 'red' }, 'hi, ' + this.msg),
                h(Foo, {
                    count: 1,
                    onAdd: this.onAdd,
                    onAddFoo: this.onAddFoo
                }, {
                    header: ({ age }) => h('div', {}, 'header' + age),
                    footer: () => h('div', {}, 'footer'),
                })
            ]
        )
    }
}
