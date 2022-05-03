import { reactive, isReactive } from "../reacticve"

describe('reactive', () => {
    it('should be reactive', () => {
        const original = { foo: 1 }
        const observed = reactive(original)
        expect(observed).not.toBe(original)
        expect(observed.foo).toBe(1)
        expect(isReactive(observed)).toBe(true)
        expect(isReactive(original)).toBe(false)
    })
})
