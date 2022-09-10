import { h } from "../../lib/mini-vue.esm.js";
export default {
    name: "Child",
    setup() { },
    render(proxy) {
        return h("div", { id: 'Child' }, [h("div", {}, "props - msg: " + this.$props.msg)]);
    },
};