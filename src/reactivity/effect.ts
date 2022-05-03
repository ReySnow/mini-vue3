import { extend } from "../shared";

let activeEffect;
let shouldTrack;// 是否需要收集依赖， stop

class ReactiveEffect {
    private _fn: any;
    deps = []
    active = true;// 不是stop状态
    onStop?: () => void
    constructor(fn, public scheduler?) {
        this._fn = fn
    }
    run() {
        // 会收集依赖
        // shouTrack 做区分
        if (!this.active) {
            return this._fn()
        }

        shouldTrack = true
        activeEffect = this
        const result = this._fn()
        // 重置
        shouldTrack = false
        return result
    }
    stop() {
        // 首次调用清空effect
        if (this.active) {
            cleanupEffect(this)
            if (this.onStop) {
                this.onStop()
            }
            this.active = false
        }
    }
}

function cleanupEffect(effect) {
    effect.deps.forEach((dep: any) => {
        dep.delete(effect)
    })
    effect.deps.length = 0
}

const targetMap = new Map()
export function track(target, key) {
    if (!isTracking()) return

    // target -> key -> dep
    let depsMap = targetMap.get(target)
    if (!depsMap) {
        depsMap = new Map()
        targetMap.set(target, depsMap)
    }

    let dep = depsMap.get(key)
    if (!dep) {
        dep = new Set()
        depsMap.set(key, dep)
    }

    trackEffects(dep)
}

export function trackEffects(dep) {
    // 已经存在dep中
    if (dep.has(activeEffect)) return

    dep.add(activeEffect)
    // effect 收集dep
    activeEffect.deps.push(dep)
}

// 是否应该收集依赖
export function isTracking() {
    return shouldTrack && activeEffect !== undefined
}

export function trigger(target, key) {
    let depsMap = targetMap.get(target)
    let dep = depsMap.get(key)

    triggerEffects(dep)
}

export function triggerEffects(dep) {
    for (const effect of dep) {
        if (effect.scheduler) {
            effect.scheduler()
        } else {
            effect.run()
        }
    }
}

export function effect(fn, options: any = {}) {
    const _effect = new ReactiveEffect(fn, options.scheduler)

    extend(_effect, options)

    _effect.run()

    const runner: any = _effect.run.bind(_effect)
    runner.effect = _effect
    return runner
}

export function stop(runner) {
    runner.effect.stop()
}
