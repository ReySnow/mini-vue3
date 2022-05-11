import { h } from "../lib/mini-vue.esm.js"

export const Foo = {
    setup(props) {
        console.log(props)
    },
    render() {
        return h('p', { class: 'blue' }, 'foo: ' + this.count)
    }
}
