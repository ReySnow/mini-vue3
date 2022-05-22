import { getCurrentInstance } from "./component";

// 父组件保存
export function provide(key, value) {
    const currentInstance: any = getCurrentInstance()
    if (currentInstance) {
        let { provides } = currentInstance
        provides[key] = value
    }
}

// 子组件获取 父提供的数据（provides）跨层级 
export function inject(key, defaultValue) {
    const currentInstance: any = getCurrentInstance()
    if (currentInstance) {
        const parentProvides = currentInstance.parent.provides;
        if (key in parentProvides) {
            return parentProvides[key]
        } else if (defaultValue) {
            if (typeof defaultValue === 'function') {
                return defaultValue()
            } else {
                return defaultValue
            }
        }
    }
}
