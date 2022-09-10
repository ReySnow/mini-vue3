import { effect } from "../src/effect"
import { reactive } from "../src/reacticve"
import { isRef, proxyRefs, ref, unRef } from "../src/ref"

describe('ref', () => {
    it('should be ref', () => {
        const a = ref(1)
        expect(a.value).toBe(1)
    })

    it('should be reactive', () => {
        const a = ref(1)
        let dummy;
        let calls = 0;
        effect(() => {
            calls++;
            dummy = a.value
        })
        expect(calls).toBe(1)
        expect(dummy).toBe(1)
        a.value = 2;
        expect(calls).toBe(2)
        expect(dummy).toBe(2)
        // 相同的值不trigger
        a.value = 2;
        expect(calls).toBe(2)
        expect(dummy).toBe(2)
    })
    it('should make obj reactive', () => {
        const a = ref({
            count: 1
        })
        let dummy;
        effect(() => {
            dummy = a.value.count
        })
        expect(dummy).toBe(1)
        a.value.count = 2 // 执行reactive的set
        // a.value = { count: 2 } // 执行ref的set
        expect(dummy).toBe(2)
    })

    it('should isRef', () => {
        const a = ref(1)
        const user = reactive({
            age: 1
        })
        expect(isRef(a)).toBe(true)
        expect(isRef(1)).toBe(false)
        expect(isRef(user)).toBe(false)
    })
    it('should unRef', () => {
        const a = ref(1)
        expect(unRef(a)).toBe(1)
        expect(unRef(1)).toBe(1)
    })

    it('should proxyRefs', () => {
        const user = {
            age: ref(10),
            name: 'aa'
        }
        const proxyUser = proxyRefs(user)
        expect(user.age.value).toBe(10)
        expect(proxyUser.age).toBe(10)
        expect(proxyUser.name).toBe('aa')

        proxyUser.age = 20
        expect(proxyUser.age).toBe(20)
        expect(user.age.value).toBe(20)

        proxyUser.age = ref(15)
        expect(proxyUser.age).toBe(15)
        expect(user.age.value).toBe(15)
    })
})
