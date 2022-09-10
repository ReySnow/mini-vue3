import { ReactiveEffect } from "./effect";

class ComputedRefImpl {
    // 控制是否调用getter, 缓存
    private _dirty: boolean = true;
    private _value: any;
    private _effect: any;

    constructor(getter) {
        // 通过effect 实现依赖收集和触发
        this._effect = new ReactiveEffect(getter, () => {
            // 依赖发生变化不执行函数 getter, effect scheduler
            // 当依赖的值变化了，改为true, 以便下次可以取到新的值
            if (!this._dirty) {
                this._dirty = true
            }
        })
    }

    get value() {
        if (this._dirty) {
            this._dirty = false;
            this._value = this._effect.run()
        }
        return this._value
    }
}

export function computed(getter) {
    return new ComputedRefImpl(getter)
}
