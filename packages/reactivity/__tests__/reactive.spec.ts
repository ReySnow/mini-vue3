import { reactive, isReactive, isProxy } from "../src/reacticve"

describe('reactive', () => {
    it('should be reactive', () => {
        const original = { foo: 1 }
        const observed = reactive(original)
        expect(observed).not.toBe(original)
        expect(observed.foo).toBe(1)
        expect(isReactive(observed)).toBe(true)
        expect(isReactive(original)).toBe(false)
        expect(isProxy(observed)).toBe(true)
    })
    it('should bar be reactive', () => {
        const original = {
            bar: {
                foo: 1
            },
            arr: [{ bar: 2 }]
        }
        const observed = reactive(original)
        expect(isReactive(observed.bar)).toBe(true)
        expect(isReactive(observed.arr)).toBe(true)
        expect(isReactive(observed.arr[0])).toBe(true)
    })
})
