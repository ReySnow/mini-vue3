import { h, renderSlots } from "../lib/mini-vue.esm.js"

export const Foo = {
    setup(props, { emit }) {
        console.log(props)

        const emitAdd = () => {
            console.log('emit');

            emit('add', 1, 32)
            emit('add-foo', 1, 32)
        }

        return {
            emitAdd
        }
    },
    render() {
        return h('div', { id: 'foo' }, [
            renderSlots(this.$slots, 'header', { age: 10 }),
            h('p', { class: 'blue', onClick: this.emitAdd }, 'foo: ' + this.count),
            renderSlots(this.$slots, 'footer')
        ])
    }
}
