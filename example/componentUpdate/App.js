import { h, ref } from "../../lib/mini-vue.esm.js"
import Child from "./Child.js"
export const App = {
    name: 'App',
    setup() {
        const count = ref(0)
        const onClick = () => {
            count.value++
        }

        const msg = ref('123')
        window.msg = msg

        const changeChildProps = () => {
            msg.value = "456";
        };


        return {
            count,
            onClick,
            msg,
            changeChildProps
        }
    },
    render() {
        return h("div", {},
            [
                h("div", {}, "count:" + this.count), // 依赖收集
                h(
                    "button",
                    {
                        onClick: this.onClick,
                    },
                    "click"
                ),
                h(Child, { msg: this.msg }),
                h(
                    "button",
                    {
                        onClick: this.changeChildProps,
                    },
                    "changeProps 修改值"
                )
            ]
        );
    }
}