import { h, renderSlots, getCurrentInstance, inject, provide } from "../dist/mini-vue.esm.js"

export const Foo = {
    name: "Foo",
    setup(props, { emit }) {
        console.log(props)
        provide('foo', 'foo2')
        provide('bar', 'bar1')
        const foo = inject('foo')
        const instance = getCurrentInstance()
        console.log('instance', instance);

        const emitAdd = () => {
            emit('add', 1, 32)
            emit('add-foo', 1, 32)
        }

        return {
            emitAdd,
            foo
        }
    },
    render() {
        return h('div', {}, [
            h('div', { id: 'foo' }, [
                renderSlots(this.$slots, 'header', { age: 10 }),
                h('p', { class: 'blue', onClick: this.emitAdd }, 'foo: ' + this.count + 'provide:' + this.foo),
                renderSlots(this.$slots, 'footer')
            ]),
            h(FooTwo)
        ])
    }
}

const FooTwo = {
    name: "FooTwo",
    setup() {
        const foo = inject('foo')
        const bar = inject('bar')
        return {
            foo,
            bar
        }
    },
    render() {
        return h('div', {}, `foo:` + this.foo + ', bar:' + this.bar)
    }
}
