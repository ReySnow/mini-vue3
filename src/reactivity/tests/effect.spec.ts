import { effect, stop } from '../effect';
import { reactive } from '../reacticve'
describe('effect', () => {
    it('happy', () => {
        const user = reactive({
            age: 10
        })
        let nextAge;
        let run = effect(() => {
            nextAge = user.age + 1
            return 'foo'
        })
        expect(nextAge).toBe(11)
        // update
        user.age++
        expect(nextAge).toBe(12)
        let r = run()
        expect(nextAge).toBe(12)
        expect(r).toBe('foo')
    })
    it('scheduler', () => {
        // 添加effect第二个参数
        // 第一次执行会执行fn
        // 当响应式对象改变 set 的时候不会执行fn, 会执行scheduler
        // 当执行runner的时候会再次执行fn
        let dummy;
        let run: any;
        const scheduler = jest.fn(() => {
            run = runner;
        })
        const obj = reactive({ foo: 1 })
        const runner = effect(() => {
            dummy = obj.foo
        }, { scheduler })
        expect(scheduler).not.toHaveBeenCalled()
        expect(dummy).toBe(1)
        // should be called on first trigger
        obj.foo++
        // 响应式对象改变未调用fn,调用了scheduler
        expect(scheduler).toHaveBeenCalledTimes(1)
        expect(dummy).toBe(1)
        // 执行run方法后调用了fn
        run()
        expect(dummy).toBe(2)
    })
    it('stop', () => {
        let dummy;
        const obj = reactive({ prop: 1 })
        const runner = effect(() => {
            dummy = obj.prop
        })
        obj.prop = 2
        expect(dummy).toBe(2)
        stop(runner)
        obj.prop++
        expect(dummy).toBe(2)

        runner()
        expect(dummy).toBe(3)
    })
    it('onStop', () => {
        const obj = reactive({ foo: 1 })
        const onStop = jest.fn()
        let dummy;
        const runner = effect(() => {
            dummy = obj.foo
        }, { onStop })
        stop(runner)
        expect(onStop).toBeCalledTimes(1)
    })
    it('should first', () => {
        expect(1).toBe(1)
    })
})

