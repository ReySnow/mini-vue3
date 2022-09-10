import { isReadonly, shallowReadonly } from "../src/reacticve"

describe('shallowReadonly', () => {
    it('should be shallowReadonly', () => {
        const original = { foo: 1, bar: { baz: 2 } }
        const wrapped = shallowReadonly(original)
        expect(isReadonly(wrapped)).toBe(true)
        expect(isReadonly(wrapped.bar)).toBe(false)
    })
    it('should warn when call set', () => {
        console.warn = jest.fn()
        const user = shallowReadonly({ age: 10 })
        user.age = 11
        expect(console.warn).toBeCalled()
    })
})
