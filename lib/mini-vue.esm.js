const extend = Object.assign;
const isObject = (val) => {
    return val !== null && typeof val === 'object';
};
const EMPTY_OBJ = {};
const hasChanged = (val, newVal) => {
    return !Object.is(val, newVal);
};
const isArray = Array.isArray;
const hasOwn = (val, key) => Object.prototype.hasOwnProperty.call(val, key);
// xx-xx => xxXx 转驼峰
const camelize = (str) => {
    return str.replace(/-(\w)/g, (_, v) => {
        return v ? v.toUpperCase() : '';
    });
};
// 首字母转大写
const capitalize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};
const toHandlerKey = (str) => {
    return str ? `on${capitalize(str)}` : '';
};

const Fragment = Symbol('Fragment');
const Text = Symbol('Text');
// 创建虚拟节点
function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        el: null,
        key: props && props.key,
        shapeFlag: getShapeFlage(type)
    };
    if (typeof children === 'string') {
        vnode.shapeFlag |= 4 /* TEXT_CHILDREN */;
    }
    else if (isArray(children)) {
        vnode.shapeFlag |= 8 /* ARRAY_CHILDREND */;
    }
    if (vnode.shapeFlag & 2 /* STATEFUL_COMPONENT */) {
        if (isObject(children)) {
            // 设置具有solts
            vnode.shapeFlag |= 16 /* SLOT_CHILDREN */;
        }
    }
    return vnode;
}
// 创建text类型的虚拟节点 渲染text文本
function createTextVNode(text) {
    return createVNode(Text, {}, text);
}
function getShapeFlage(type) {
    return typeof type === 'string'
        ? 1 /* ELELEMT */
        : 2 /* STATEFUL_COMPONENT */;
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

function renderSlots(slots, key, props) {
    const slot = slots[key];
    if (slot) {
        if (typeof slot === 'function') {
            return createVNode(Fragment, {}, slot(props));
        }
    }
}

let activeEffect;
let shouldTrack; // 是否需要收集依赖， stop
class ReactiveEffect {
    constructor(fn, scheduler) {
        this.scheduler = scheduler;
        this.deps = [];
        this.active = true; // 不是stop状态
        this._fn = fn;
    }
    run() {
        // 会收集依赖
        // shouTrack 做区分
        if (!this.active) {
            return this._fn();
        }
        shouldTrack = true;
        activeEffect = this;
        const result = this._fn();
        // 重置
        shouldTrack = false;
        return result;
    }
    stop() {
        // 首次调用清空effect
        if (this.active) {
            cleanupEffect(this);
            if (this.onStop) {
                this.onStop();
            }
            this.active = false;
        }
    }
}
function cleanupEffect(effect) {
    effect.deps.forEach((dep) => {
        dep.delete(effect);
    });
    effect.deps.length = 0;
}
const targetMap = new Map();
function track(target, key) {
    if (!isTracking())
        return;
    // target -> key -> dep
    let depsMap = targetMap.get(target);
    if (!depsMap) {
        depsMap = new Map();
        targetMap.set(target, depsMap);
    }
    let dep = depsMap.get(key);
    if (!dep) {
        dep = new Set();
        depsMap.set(key, dep);
    }
    trackEffects(dep);
}
function trackEffects(dep) {
    // 已经存在dep中
    if (dep.has(activeEffect))
        return;
    dep.add(activeEffect);
    // effect 收集dep, 是为了可以清空
    activeEffect.deps.push(dep);
}
// 是否应该收集依赖
function isTracking() {
    return shouldTrack && activeEffect !== undefined;
}
function trigger(target, key) {
    let depsMap = targetMap.get(target);
    let dep = depsMap.get(key);
    triggerEffects(dep);
}
function triggerEffects(dep) {
    for (const effect of dep) {
        if (effect.scheduler) {
            effect.scheduler();
        }
        else {
            effect.run();
        }
    }
}
function effect(fn, options = {}) {
    const _effect = new ReactiveEffect(fn, options.scheduler);
    extend(_effect, options);
    _effect.run();
    const runner = _effect.run.bind(_effect);
    runner.effect = _effect;
    return runner;
}

const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);
function createGetter(isReadonly = false, shallow = false) {
    return function get(target, key) {
        // 判读是否是 reactive
        if (key === "__v_isReactive" /* IS_REACTIVE */) {
            return !isReadonly;
        }
        else if (key === "__v_isReadonly" /* IS_READONLY */) {
            return isReadonly;
        }
        const res = Reflect.get(target, key);
        if (shallow) {
            return res;
        }
        // 是不是object, 多层次
        if (isObject(res)) {
            return isReadonly ? readonly(res) : reactive(res);
        }
        if (!isReadonly) {
            // 依赖收集
            track(target, key);
        }
        return res;
    };
}
function createSetter() {
    return function set(target, key, value) {
        const res = Reflect.set(target, key, value);
        // 触发依赖
        trigger(target, key);
        return res;
    };
}
const mutableHandlers = {
    get,
    set
};
const readonlyHandlers = {
    get: readonlyGet,
    set(target, key, value) {
        console.warn(`key: ${key} set 失败 target 是readonly`, target);
        return true;
    }
};
const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
    get: shallowReadonlyGet
});

function reactive(raw) {
    return createActiviteObject(raw, mutableHandlers);
}
function readonly(raw) {
    return createActiviteObject(raw, readonlyHandlers);
}
function shallowReadonly(raw) {
    return createActiviteObject(raw, shallowReadonlyHandlers);
}
function createActiviteObject(raw, baseHandlers) {
    // 创建响应式对象
    return new Proxy(raw, baseHandlers);
}

class RefImpl {
    constructor(value) {
        this.__v_isRef = true;
        this._rawValue = value;
        // 如果是对象的话转成reactive
        this._value = convert(value);
        this.dep = new Set();
    }
    get value() {
        trackRefValues(this);
        return this._value;
    }
    set value(newValue) {
        if (hasChanged(newValue, this._rawValue)) {
            this._rawValue = newValue;
            this._value = convert(newValue);
            triggerEffects(this.dep);
        }
    }
}
function trackRefValues(ref) {
    // 收集依赖
    if (isTracking()) {
        trackEffects(ref.dep);
    }
}
const convert = (value) => {
    return isObject(value) ? reactive(value) : value;
};
function ref(value) {
    return new RefImpl(value);
}
function isRef(value) {
    return !!value.__v_isRef;
}
function unRef(ref) {
    return isRef(ref) ? ref.value : ref;
}
function proxyRefs(objectWithRefs) {
    return new Proxy(objectWithRefs, {
        get(target, key) {
            // 是ref 返回 .value
            return unRef(Reflect.get(target, key));
        },
        set(target, key, value) {
            // 是ref 设置 .value
            if (isRef(target[key]) && !isRef(value)) {
                return (target[key].value = value);
            }
            else {
                return Reflect.set(target, key, value);
            }
        }
    });
}

function emit(instance, event, ...arg) {
    const { props } = instance;
    const handlerName = toHandlerKey(camelize(event));
    const handler = props[handlerName];
    handler && handler(...arg);
}

function initprops(instance, raw) {
    instance.props = raw || {};
}

const publicPropertiesMap = {
    $el: i => i.vnode.el,
    $slots: i => i.slots
};
const publicInstanceHandlers = {
    get({ _: instance }, key) {
        // 处理this取值
        const { setupState, props } = instance;
        if (hasOwn(setupState, key)) {
            return setupState[key];
        }
        else if (hasOwn(props, key)) {
            return props[key];
        }
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    }
};

// 初始化slots
function initSlots(instance, children) {
    const { vnode } = instance;
    if (vnode.shapeFlag & 16 /* SLOT_CHILDREN */) {
        normalizeObjectSlots(instance.slots, children);
    }
}
// 给slots赋值
function normalizeObjectSlots(slots, children) {
    for (let key in children) {
        const value = children[key];
        // slot 是个函数
        slots[key] = (props) => normalizeSlotValue(value(props));
    }
}
function normalizeSlotValue(value) {
    return isArray(value) ? value : [value];
}

let currentInstance = null;
// 创建组件实例
function createComponentInstance(vnode, parent) {
    const instance = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},
        emit: () => { },
        slots: {},
        // 使用父级的来初始化 原形链 provide-inject 功能
        provides: parent ? Object.create(parent.provides) : {},
        parent,
        isMounleted: false,
        subTree: {}
    };
    instance.emit = emit.bind(null, instance);
    return instance;
}
function setupComponent(instance) {
    // 初始化props
    initprops(instance, instance.vnode.props);
    // 初始化插槽
    initSlots(instance, instance.vnode.children);
    setupStatefulComponent(instance);
}
// 调用组件的setup方法，传递props，将setup返回值赋值到组件的instance上
function setupStatefulComponent(instance) {
    const component = instance.type;
    // render 的 ctx 
    // 通过代理对象取值实现在 render 中通过 this.xx 取值
    instance.proxy = new Proxy({ _: instance }, publicInstanceHandlers);
    const { setup } = component;
    if (setup) {
        // 获取组件实例只能在setup函数中执行
        setCurrentInstance(instance);
        // setup 返回对象或函数
        const setupResult = setup(shallowReadonly(instance.props), {
            emit: instance.emit,
        });
        setCurrentInstance(null);
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    if (typeof setupResult === 'object') {
        // proxyRefs 使render中的ref可以直接取值
        instance.setupState = proxyRefs(setupResult);
    }
    finishComponent(instance);
}
function finishComponent(instance) {
    const component = instance.type;
    if (component.render) {
        instance.render = component.render;
    }
}
function setCurrentInstance(instance) {
    currentInstance = instance;
}
function getCurrentInstance() {
    return currentInstance;
}

// 父组件保存
function provide(key, value) {
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        let { provides } = currentInstance;
        provides[key] = value;
    }
}
// 子组件获取 父提供的数据（provides）跨层级 
function inject(key, defaultValue) {
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        const parentProvides = currentInstance.parent.provides;
        if (key in parentProvides) {
            return parentProvides[key];
        }
        else if (defaultValue) {
            if (typeof defaultValue === 'function') {
                return defaultValue();
            }
            else {
                return defaultValue;
            }
        }
    }
}

function createAppAPI(render) {
    return function createApp(rootComponent) {
        return {
            mount(rootContainer) {
                // component 转换成vnode 逻辑基于vnode操作
                const vnode = createVNode(rootComponent);
                render(vnode, rootContainer);
            }
        };
    };
}

function createRenderer(options) {
    // 根据不同的平台传入对应的创建元素，插入元素，处理props 方法
    const { createElement: HostCreateElement, patchProp: HostPatchProp, insert: hostInsert, remove: hostRemove, setElementText: hostSetElementText } = options;
    function render(vnode, container) {
        // 递归处理
        patch(null, vnode, container, null, null);
    }
    // n1老的 n2新的
    function patch(n1, n2, container, parentComponent, anchor) {
        // 判断vnode类型 component element
        const { shapeFlag, type } = n2;
        switch (type) {
            case Fragment:
                processFragment(n1, n2, container, parentComponent, anchor);
                break;
            case Text:
                processText(n1, n2, container);
                break;
            default:
                if (shapeFlag & 1 /* ELELEMT */) {
                    processElement(n1, n2, container, parentComponent, anchor);
                }
                else if (shapeFlag & 2 /* STATEFUL_COMPONENT */) {
                    processComponent(n1, n2, container, parentComponent, anchor);
                }
        }
    }
    // 处理fragment，只渲染children
    function processFragment(n1, n2, container, parentComponent, anchor) {
        mountChildren(n2.children, container, parentComponent, anchor);
    }
    // 渲染text文本
    function processText(n1, n2, container) {
        const { children } = n2;
        const textNode = n2.el = document.createTextNode(children);
        container.append(textNode);
    }
    // 处理类型为element的vnode
    function processElement(n1, n2, container, parentComponent, anchor) {
        if (!n1) {
            mountElement(n2, container, parentComponent, anchor);
        }
        else {
            patchElement(n1, n2, container, parentComponent, anchor);
        }
    }
    function patchElement(n1, n2, container, parentComponent, anchor) {
        console.log('patchElement', n1, n2);
        let oldProps = n1.props || EMPTY_OBJ;
        let newProps = n2.props || EMPTY_OBJ;
        // 此时n2没有el
        let el = n2.el = n1.el;
        patchProps(el, oldProps, newProps);
        patchChildren(n1, n2, el, parentComponent, anchor);
    }
    function patchChildren(n1, n2, container, parentComponent, anchor) {
        const { shapeFlag: prevShapeFlag, children: c1 } = n1;
        const { shapeFlag, children: c2 } = n2;
        // 新的是文本节点
        if (shapeFlag & 4 /* TEXT_CHILDREN */) {
            if (prevShapeFlag & 8 /* ARRAY_CHILDREND */) {
                // 数组 => 文本 先删除数组中的元素
                unMountChildren(c1);
            }
            if (c1 !== c2) {
                // 设置新的文本
                hostSetElementText(container, c2);
            }
        }
        else {
            // 新的是数组
            if (prevShapeFlag & 4 /* TEXT_CHILDREN */) {
                // 文本转数组, 先清空文本， 挂载数组
                hostSetElementText(container, '');
                mountChildren(c2, container, parentComponent, anchor);
            }
            else {
                patchKeyedChildren(c1, c2, container, parentComponent, anchor);
            }
        }
    }
    function patchKeyedChildren(c1, c2, container, parentComponent, parentAnchor) {
        let l2 = c2.length;
        let e1 = c1.length - 1;
        let e2 = l2 - 1;
        let i = 0;
        function isSameVnodeType(n1, n2) {
            return n1.type === n2.type && n1.key === n2.key;
        }
        // 左端
        while (i <= e1 && i <= e2) {
            let n1 = c1[i];
            let n2 = c2[i];
            if (isSameVnodeType(n1, n2)) {
                patch(n1, n2, container, parentComponent, parentAnchor);
            }
            else {
                break;
            }
            i++;
        }
        // 右端
        while (i <= e1 && i <= e2) {
            let n1 = c1[e1];
            let n2 = c2[e2];
            if (isSameVnodeType(n1, n2)) {
                patch(n1, n2, container, parentComponent, parentAnchor);
            }
            else {
                break;
            }
            e1--;
            e2--;
        }
        console.log(i, e1, e2);
        // 新的比老的长 创建
        if (i > e1) {
            if (i <= e2) {
                let nextPos = e2 + 1;
                let anchor = nextPos < l2 ? c2[nextPos].el : null;
                console.log('nextPos', nextPos, anchor, l2);
                while (i <= e2) {
                    patch(null, c2[i], container, parentComponent, anchor);
                    i++;
                }
            }
        }
        else if (i > e2) {
            // 老的比新的长 删除
            while (i <= e1) {
                hostRemove(c1[i].el);
                i++;
            }
        }
    }
    function unMountChildren(children) {
        for (let item of children) {
            let el = item.el;
            hostRemove(el);
        }
    }
    // 更新props
    function patchProps(el, oldProps, newProps) {
        if (oldProps !== newProps) {
            for (const key in newProps) {
                const prevProp = oldProps[key];
                const nextProp = newProps[key];
                if (prevProp !== nextProp) {
                    HostPatchProp(el, key, prevProp, nextProp);
                }
            }
            if (oldProps !== EMPTY_OBJ) {
                for (const key in oldProps) {
                    // 新的props中没有这个属性， 删除
                    if (!(key in newProps)) {
                        HostPatchProp(el, key, oldProps[key], null);
                    }
                }
            }
        }
    }
    // 挂载elememt
    function mountElement(vnode, container, parentComponent, anchor) {
        const { children, props, type, shapeFlag } = vnode;
        // type = div p span  赋值给vnode.el -> this.$el 取值
        // const el = vnode.el = document.createElement(type)
        const el = vnode.el = HostCreateElement(type);
        if (shapeFlag & 4 /* TEXT_CHILDREN */) {
            el.textContent = children;
        }
        else if (shapeFlag & 8 /* ARRAY_CHILDREND */) {
            mountChildren(vnode.children, el, parentComponent, anchor);
        }
        for (let key in props) {
            const val = props[key];
            // const isOn = (key: string) => /^on[A-Z]/.test(key)
            // if (isOn(key)) {
            //     const even = key.slice(2).toLocaleLowerCase()
            //     el.addEventListener(even, val)
            // } else {
            //     el.setAttribute(key, val)
            // }
            HostPatchProp(el, key, null, val);
        }
        // container.append(el)
        hostInsert(el, container, anchor);
    }
    // 处理子节点
    function mountChildren(children, container, parentComponent, anchor) {
        children.forEach(element => {
            // 递归处理子节点
            patch(null, element, container, parentComponent, anchor);
        });
    }
    // 处理类型为component的vnode
    function processComponent(n1, n2, container, parentComponent, anchor) {
        mountComponent(n2, container, parentComponent, anchor);
    }
    // 挂载component
    function mountComponent(initialVNode, container, parentComponent, anchor) {
        // 创建组件实例
        const instance = createComponentInstance(initialVNode, parentComponent);
        setupComponent(instance);
        setupRenderEffect(instance, initialVNode, container, anchor);
    }
    function setupRenderEffect(instance, initialVNode, container, anchor) {
        // finishComponent 中设置了render
        // subtree 就是虚拟节点
        // 将proxy绑定到this上
        // 组件的render函数会使用响应式对象 this.xxxx 此时会收集依赖
        // 当响应式对象发生改变的时候会在次执行
        effect(() => {
            if (!instance.isMounleted) {
                const { proxy } = instance;
                const subTree = instance.subTree = instance.render.call(proxy);
                patch(null, subTree, container, instance, anchor);
                initialVNode.el = subTree.el;
                instance.isMounleted = true;
            }
            else {
                console.log('update');
                const { proxy } = instance;
                const subTree = instance.render.call(proxy);
                const prevSubTree = instance.subTree;
                instance.subTree = subTree;
                patch(prevSubTree, subTree, container, instance, anchor);
            }
        });
    }
    return {
        createApp: createAppAPI(render)
    };
}

const createElement = (type) => {
    return document.createElement(type);
};
const patchProp = (el, key, prevVal, nextVal) => {
    const isOn = (key) => /^on[A-Z]/.test(key);
    if (isOn(key)) {
        const even = key.slice(2).toLocaleLowerCase();
        el.addEventListener(even, nextVal);
    }
    else {
        if (nextVal === undefined || nextVal === null) {
            el.removeAttribute(key, nextVal);
        }
        else {
            el.setAttribute(key, nextVal);
        }
    }
};
const insert = (child, parent, anchor) => {
    // parent.append(el)
    parent.insertBefore(child, anchor || null);
};
// 移除一个元素
const remove = (child) => {
    const parent = child.parentNode;
    if (parent) {
        parent.removeChild(child);
    }
};
const setElementText = (el, text) => {
    el.textContent = text;
};
// 创建 runtime-dom 的自定义渲染器
const renderer = createRenderer({
    createElement,
    patchProp,
    insert,
    remove,
    setElementText
});
// 导出 runtime-dom 的createApp
function createApp(...args) {
    return renderer.createApp(...args);
}

export { createApp, createRenderer, createTextVNode, effect, getCurrentInstance, h, inject, provide, proxyRefs, ref, renderSlots };
