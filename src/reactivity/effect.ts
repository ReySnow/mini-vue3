
class ReactEffect {
    private fn: any;
    constructor(fn) {
        this.fn = fn
    }

    run() {
        activeEffect = this
        return this.fn()
    }
}

const targetMap = new Map()
export function track(target, key) {
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
}

export function trigger(target, key) {
    console.log(targetMap);

    let depsMap = targetMap.get(target)
    let dep = depsMap.get(key)

    for (const effect of dep) {
        effect.run()
    }
}

let activeEffect;
export function effect(fn) {
    const _effect = new ReactEffect(fn)
    _effect.run()
    return _effect.run.bind(_effect)
}
