import { h, ref } from "../../lib/mini-vue.esm.js"
export const App = {
    setup() {
        const count = ref(0)
        const onClick = () => {
            count.value++
        }

        const props = ref({
            foo: 'foo',
            bar: 'bar'
        })
        const onChangeProps1 = () => {
            props.value.foo = 'foo1'
        }
        const onChangeProps2 = () => {
            props.value.foo = undefined
        }
        const onChangeProps3 = () => {
            props.value = {
                foo: 'foo'
            }
        }
        return {
            count,
            onClick,
            props,
            onChangeProps1,
            onChangeProps2,
            onChangeProps3
        }
    },
    render() {
        return h(
            "div",
            {
                id: "root",
                ...this.props
            },
            [
                h("div", {}, "count:" + this.count), // 依赖收集
                h(
                    "button",
                    {
                        onClick: this.onClick,
                    },
                    "click"
                ),
                h(
                    "button",
                    {
                        onClick: this.onChangeProps1,
                    },
                    "changeProps 修改值"
                ),
                h(
                    "button",
                    {
                        onClick: this.onChangeProps2,
                    },
                    "设置 undefined 删除"
                ),
                h(
                    "button",
                    {
                        onClick: this.onChangeProps3,
                    },
                    "删除 bar"
                ),
            ]
        );
    }
}