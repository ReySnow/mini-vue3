import { computed } from "../src/computed"
import { reactive } from "../src/reacticve"

describe('computed', () => {
    it('should computed', () => {
        // 通过 .value 取值 ref
        const user = reactive({
            age: 10
        })
        const age = computed(() => {
            return user.age
        })
        expect(age.value).toBe(10)
    })

    it('should computed lazily', () => {
        // 依赖不变化 fn 不会执行，且取值（.value）的时候 fn 才会执行
        const user = reactive({
            age: 10
        })
        const getter = jest.fn(() => {
            return user.age
        })
        const age = computed(getter)
        expect(getter).not.toHaveBeenCalled()
        expect(age.value).toBe(10)
        expect(getter).toBeCalledTimes(1)
        age.value
        expect(getter).toBeCalledTimes(1)
        // 依赖变化 trigger -> effect
        user.age = 20
        // 依赖发生变化不执行函数, effect scheduler
        expect(getter).toBeCalledTimes(1)

        expect(age.value).toBe(20)
        expect(getter).toBeCalledTimes(2)
    })
})
