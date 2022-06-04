import { h, ref } from "../../lib/mini-vue.esm.js"
// 1 左端对比
// (a b) c
// (a b) d e
// const prevChildren = [
//     h('div', { key: 'A' }, 'A'),
//     h('div', { key: 'B' }, 'B'),
//     h('div', { key: 'C' }, 'C'),
// ]
// const nextChildren = [
//     h('div', { key: 'A' }, 'Aq'),
//     h('div', { key: 'B' }, 'B'),
//     h('div', { key: 'D' }, 'D'),
//     h('div', { key: 'E' }, 'E'),
// ]

// 2 右端对比
//   a (b c)
// d e (b c)
// const prevChildren = [
//     h('div', { key: 'A' }, 'A'),
//     h('div', { key: 'B' }, 'B'),
//     h('div', { key: 'C' }, 'C'),
// ]
// const nextChildren = [
//     h('div', { key: 'D' }, 'D'),
//     h('div', { key: 'E' }, 'E'),
//     h('div', { key: 'B' }, 'BB'),
//     h('div', { key: 'C' }, 'C'),
// ]

// 3 新的比老的长
// 3.1 左侧
// (a b)
// (a b) c d
// i = 2  e1 = 1  e2 = 3
// const prevChildren = [
//     h('div', { key: 'A' }, 'A'),
//     h('div', { key: 'B' }, 'B'),
// ]
// const nextChildren = [
//     h('div', { key: 'A' }, 'A'),
//     h('div', { key: 'B' }, 'B'),
//     h('div', { key: 'C' }, 'C'),
//     h('div', { key: 'D' }, 'D'),
// ]

// 3.2 右侧
//     (a b)
// d c (a b)
// i = 0  e1 = -1 e2 = 1
// const prevChildren = [
//     h('div', { key: 'A' }, 'A'),
//     h('div', { key: 'B' }, 'B'),
// ]
// const nextChildren = [
//     h('div', { key: 'D' }, 'D'),
//     h('div', { key: 'C' }, 'C'),
//     h('div', { key: 'A' }, 'A'),
//     h('div', { key: 'B' }, 'B'),
// ]

// 4 老的比新的长
// 4.1 左侧
// (a b) c d
// (a b)
// i = 2  e1 = 3  e2 = 1
// const prevChildren = [
//     h('div', { key: 'A' }, 'A'),
//     h('div', { key: 'B' }, 'B'),
//     h('div', { key: 'C' }, 'C'),
//     h('div', { key: 'D' }, 'D'),
// ]
// const nextChildren = [
//     h('div', { key: 'A' }, 'A'),
//     h('div', { key: 'B' }, 'B'),
// ]

// 4.2 右侧
// d c (a b)
// (a b)
// i = 0  e1 = 1  e2 = -1
const prevChildren = [
    h('div', { key: 'D' }, 'D'),
    h('div', { key: 'C' }, 'C'),
    h('div', { key: 'A' }, 'A'),
    h('div', { key: 'B' }, 'B'),
]
const nextChildren = [
    h('div', { key: 'A' }, 'A'),
    h('div', { key: 'B' }, 'B'),
]


export default {
    name: 'ArrayToArray',
    setup() {
        const isChange = ref(false)
        window.isChange = isChange
        return { isChange }
    },
    render() {
        const self = this
        return self.isChange === true
            ? h('div', {}, nextChildren)
            : h('div', {}, prevChildren)
    }
}