import { hasChanged, isObject } from "../shared";
import { isTracking, trackEffects, triggerEffects } from "./effect";
import { reactive } from "./reacticve";

class RefImpl {
    private _value: any;
    private _rawValue: any;
    public dep: Set<any>;
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
