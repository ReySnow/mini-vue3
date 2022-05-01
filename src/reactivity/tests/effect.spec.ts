import { effect } from '../effect';
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
        user.age++
        expect(nextAge).toBe(12)
        let r = run()
        expect(nextAge).toBe(12)
        expect(r).toBe('foo')
    })
    it('should first', () => {
        expect(1).toBe(1)
    })
})

