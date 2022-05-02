
class ReactiveEffect {
    private _fn: any;
    deps = []
    active = true
    constructor(fn, public scheduler?) {
        this._fn = fn
    }
    run() {
        activeEffect = this
        return this._fn()
    }
    stop() {
        // 首次调用清空effect
        if (this.active) {
            cleanupEffect(this)
            this.active = false
        }
    }
}

function cleanupEffect(effect) {
    effect.deps.forEach((dep: any) => {
        dep.delete(effect)
    })
}

const targetMap = new Map()
export function track(target, key) {
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
    dep.add(activeEffect)
    // effect 收集dep
    activeEffect.deps.push(dep)
}

export function trigger(target, key) {
    console.log(targetMap);

    let depsMap = targetMap.get(target)
    let dep = depsMap.get(key)

    for (const effect of dep) {
        if (effect.scheduler) {
            effect.scheduler()
        } else {
            effect.run()
        }
    }
}

let activeEffect;
export function effect(fn, options: any = {}) {
    const _effect = new ReactiveEffect(fn, options.scheduler)
    _effect.run()

    const runner: any = _effect.run.bind(_effect)
    runner.effect = _effect
    return runner
}

export function stop(runner) {
    runner.effect.stop()
}
