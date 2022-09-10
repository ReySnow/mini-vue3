import { hasChanged, isObject } from "@mini-vue/shared";
import { isTracking, trackEffects, triggerEffects } from "./effect";
import { reactive } from "./reacticve";

class RefImpl {
    private _value: any;
    private _rawValue: any;
    public dep: Set<any>;
    public __v_isRef = true;
    constructor(value) {
        this._rawValue = value
        // 如果是对象的话转成reactive
        this._value = convert(value)
        this.dep = new Set()
    }

    get value() {
        trackRefValues(this)
        return this._value
    }

    set value(newValue) {
        if (hasChanged(newValue, this._rawValue)) {
            this._rawValue = newValue
            this._value = convert(newValue)
            triggerEffects(this.dep)
        }
    }
}

function trackRefValues(ref) {
    // 收集依赖
    if (isTracking()) {
        trackEffects(ref.dep)
    }
}

const convert = (value) => {
    return isObject(value) ? reactive(value) : value
}

export function ref(value) {
    return new RefImpl(value)
}

export function isRef(value) {
    return !!value.__v_isRef
}

export function unRef(ref) {
    return isRef(ref) ? ref.value : ref
}

export function proxyRefs(objectWithRefs) {
    return new Proxy(objectWithRefs, {
        get(target, key) {
            // 是ref 返回 .value
            return unRef(Reflect.get(target, key))
        },
        set(target, key, value) {
            // 是ref 设置 .value
            if (isRef(target[key]) && !isRef(value)) {
                return (target[key].value = value)
            } else {
                return Reflect.set(target, key, value)
            }
        }
    })
}
