function toDisplayString(value) {
    return new String(value);
}

const extend = Object.assign;
const isObject = (val) => {
    return val !== null && typeof val === 'object';
};
const isString = (val) => typeof val === 'string';
const isArray = Array.isArray;
const EMPTY_OBJ = {};
const hasChanged = (val, newVal) => {
    return !Object.is(val, newVal);
};
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
        component: null,
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
function stop(runner) {
    runner.effect.stop();
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
function isReactive(value) {
    // 普通对象得到 undefined
    return !!value["__v_isReactive" /* IS_REACTIVE */];
}
function isReadonly(value) {
    return !!value["__v_isReadonly" /* IS_READONLY */];
}
function isProxy(value) {
    return isReactive(value) || isReadonly(value);
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
    $slots: i => i.slots,
    $props: i => i.props,
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
        next: null,
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
    if (compiler && !component.render) {
        if (component.template) {
            // 通过compiler生成render函数
            component.render = compiler(component.template);
        }
    }
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
let compiler;
// 将compile传入进来 一开始的时候就会自动生成
function registerRuntimeCompiler(_compiler) {
    compiler = _compiler;
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

function shouldComponentUpdate(prevVNode, nextVNode) {
    const { props: prevProps } = prevVNode;
    const { props: nextProps } = nextVNode;
    console.log('prevProps', prevProps, nextProps);
    for (const key in nextProps) {
        if (nextProps[key] !== prevProps[key]) {
            return true;
        }
    }
    return false;
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

const queue = [];
let isFlushPending = false;
function nextTick(fn) {
    // 创建微任务
    return fn ? Promise.resolve().then(fn) : Promise.resolve();
}
function queueJobs(job) {
    if (queue.indexOf(job) === -1) {
        queue.push(job);
    }
    queueFlush();
}
function queueFlush() {
    if (isFlushPending)
        return;
    isFlushPending = true;
    nextTick(flushJobs);
}
function flushJobs() {
    isFlushPending = false;
    let job;
    while ((job = queue.shift())) {
        job && job();
    }
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
        else {
            // 对比中间的
            let s1 = i;
            let s2 = i;
            const toBePatched = e2 - s2 + 1; // 需要被比较的
            let patched = 0;
            // 新的元素在老的序列中的位置, 为了获取最长递增子序列
            const newIndexToOldIndexMap = Array.from({ length: toBePatched }, () => 0);
            let moved = false;
            let maxNewIndexSoFar = 0;
            // 将新的里面的按照 key->index 保存起来
            const keyToNewIndexMap = new Map();
            for (let i = s2; i <= e2; i++) {
                keyToNewIndexMap.set(c2[i].key, i);
            }
            for (let i = s1; i <= e1; i++) {
                const prevChild = c1[i];
                // 中间部分，老的比新的多， 那么多出来的直接就可以被干掉(优化删除逻辑)
                if (patched >= toBePatched) {
                    hostRemove(prevChild.el);
                    continue;
                }
                let newIndex;
                // 老的是否还在新的里面
                if (prevChild.key != null) {
                    newIndex = keyToNewIndexMap.get(prevChild.key);
                }
                else {
                    for (let j = s2; j <= e2; j++) {
                        if (isSameVnodeType(prevChild, c2[j])) {
                            newIndex = j;
                            break;
                        }
                    }
                }
                if (newIndex) {
                    //  c d e -> e c d   e的index变小了表示有移动的元素
                    if (newIndex >= maxNewIndexSoFar) {
                        maxNewIndexSoFar = newIndex;
                    }
                    else {
                        moved = true;
                    }
                    newIndexToOldIndexMap[newIndex - s2] = i + 1; // +1是为了不为0
                    patch(prevChild, c2[newIndex], container, parentComponent, null);
                    patched++;
                }
                else {
                    hostRemove(prevChild.el);
                }
            }
            // 递增子序列下标数组
            const increasingNewIndexSequence = moved
                ? getSequence(newIndexToOldIndexMap)
                : [];
            let j = increasingNewIndexSequence.length - 1;
            // 从后面向前计算
            for (let i = toBePatched - 1; i >= 0; i--) {
                const nextIndex = i + s2;
                const nextChild = c2[nextIndex];
                const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null;
                if (newIndexToOldIndexMap[i] === 0) {
                    // 新的不在老的里面，需要新增的
                    patch(null, nextChild, container, parentComponent, anchor);
                }
                else if (moved) {
                    if (j < 0 || i !== increasingNewIndexSequence[j]) {
                        // 新的排列序列中的元素不在递增子序列中，表示位置移动了
                        hostInsert(nextChild.el, container, anchor);
                    }
                    else {
                        j--; // 继续判断下个位置
                    }
                }
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
        if (!n1) {
            mountComponent(n2, container, parentComponent, anchor);
        }
        else {
            updateComponent(n1, n2);
        }
    }
    function updateComponent(n1, n2) {
        console.log('updateComponent 更新component ', n1, n2);
        // vnode.component 在挂载（mountComponent）的时候会设置
        const instance = n2.component = n1.component;
        if (shouldComponentUpdate(n1, n2)) {
            instance.next = n2;
            instance.update();
        }
        else {
            // 当不需要更新component的时候也需要更新一下el, 并将新的vnode设置到instance上
            n2.el = n1.el;
            instance.vnode = n2;
        }
    }
    // 挂载component
    function mountComponent(initialVNode, container, parentComponent, anchor) {
        // 创建组件实例  将compenent设置到vnode上， 组件更新的时候用
        const instance = initialVNode.component = createComponentInstance(initialVNode, parentComponent);
        setupComponent(instance);
        setupRenderEffect(instance, initialVNode, container, anchor);
    }
    function setupRenderEffect(instance, initialVNode, container, anchor) {
        // finishComponent 中设置了render
        // subtree 就是虚拟节点
        // 将proxy绑定到this上
        // 组件的render函数会使用响应式对象 this.xxxx 此时会收集依赖
        // 当响应式对象发生改变的时候会在次执行
        // effect 会返回fn，当父组件更新的时候子组件调用其 fn 来更新
        instance.update = effect(() => {
            if (!instance.isMounleted) {
                const { proxy } = instance;
                // 第二个proxy作为render的第一个参数
                const subTree = instance.subTree = instance.render.call(proxy, proxy);
                patch(null, subTree, container, instance, anchor);
                initialVNode.el = subTree.el;
                instance.isMounleted = true;
            }
            else {
                console.log('update-effect');
                // vnode 是之前的，next是下次新的
                const { next, vnode } = instance;
                if (next) {
                    // 在更新之前去更新当前组件实例上的属性
                    next.el = vnode.el; // 将老的el赋值给新的
                    updateComponentPreRender(instance, next);
                }
                const { proxy } = instance;
                const subTree = instance.render.call(proxy, proxy);
                const prevSubTree = instance.subTree;
                instance.subTree = subTree;
                console.log('prevSubTree', prevSubTree, subTree);
                console.log(container);
                patch(prevSubTree, subTree, container, instance, anchor);
            }
        }, {
            scheduler() {
                queueJobs(instance.update);
            }
        });
    }
    return {
        createApp: createAppAPI(render)
    };
}
function updateComponentPreRender(instance, nextVNode) {
    instance.vnode = nextVNode; // 将新的vnode赋值回去
    instance.next = null;
    instance.props = nextVNode.props; // 将新的组件props赋值回去
}
// 获取最长递增子序列
function getSequence(arr) {
    const p = arr.slice();
    const result = [0];
    let i, j, u, v, c;
    const len = arr.length;
    for (i = 0; i < len; i++) {
        const arrI = arr[i];
        if (arrI !== 0) {
            j = result[result.length - 1];
            if (arr[j] < arrI) {
                p[i] = j;
                result.push(i);
                continue;
            }
            u = 0;
            v = result.length - 1;
            while (u < v) {
                c = (u + v) >> 1;
                if (arr[result[c]] < arrI) {
                    u = c + 1;
                }
                else {
                    v = c;
                }
            }
            if (arrI < arr[result[u]]) {
                if (u > 0) {
                    p[i] = result[u - 1];
                }
                result[u] = i;
            }
        }
    }
    u = result.length;
    v = result[u - 1];
    while (u-- > 0) {
        result[u] = v;
        v = p[v];
    }
    return result;
}

// 依赖关系 runtime-dom -> runtime-core
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

var runtimeDom = /*#__PURE__*/Object.freeze({
    __proto__: null,
    createApp: createApp,
    h: h,
    renderSlots: renderSlots,
    createTextVNode: createTextVNode,
    createElementVnode: createVNode,
    getCurrentInstance: getCurrentInstance,
    registerRuntimeCompiler: registerRuntimeCompiler,
    provide: provide,
    inject: inject,
    createRenderer: createRenderer,
    nextTick: nextTick,
    toDisplayString: toDisplayString,
    ref: ref,
    proxyRefs: proxyRefs,
    isRef: isRef,
    unRef: unRef,
    effect: effect,
    stop: stop,
    reactive: reactive,
    readonly: readonly,
    shallowReadonly: shallowReadonly,
    isReactive: isReactive,
    isReadonly: isReadonly,
    isProxy: isProxy
});

const TO_DISPLAY_STRING = Symbol('toDisplayString');
const CREAETE_ELEMENT_VNODE = Symbol('createElementVnode');
const helperMapNames = {
    [TO_DISPLAY_STRING]: 'toDisplayString',
    [CREAETE_ELEMENT_VNODE]: 'createElementVnode'
};

function genreate(ast) {
    const context = createCodegenContext();
    const { push } = context;
    genFunctionPreamble(ast, context);
    const functionName = 'render';
    const args = ['_ctx', '_catch'];
    push(`function ${functionName}(${args.join(', ')}){`);
    push('return ');
    genNode(ast.codegenNode, context);
    push('}');
    return {
        code: context.code
    };
}
// 处理开头导入部分
function genFunctionPreamble(ast, context) {
    const { push } = context;
    const VueBinging = 'Vue';
    // 别名
    const aliasHelper = s => `${helperMapNames[s]}: _${helperMapNames[s]}`;
    if (ast.helpers.length > 0) {
        push(`const { ${ast.helpers.map(aliasHelper).join(', ')} } = ${VueBinging}`);
        push('\n');
    }
    push('return ');
}
// 处理节点
function genNode(node, context) {
    switch (node.type) {
        case 3 /* TEXT */:
            genText(node, context);
            break;
        case 0 /* INTERPOLATION */:
            genInterpolation(node, context);
            break;
        case 1 /* SIMPLE_EXPRESSION */:
            genExpression(node, context);
            break;
        case 2 /* ELEMENT */:
            genElement(node, context);
            break;
        case 5 /* COMPOUND_EXPRESSION */:
            genCompoundExpression(node, context);
            break;
    }
}
// 处理组合类型的节点
function genCompoundExpression(node, context) {
    const { push } = context;
    const { children } = node;
    for (let item of children) {
        if (isString(item)) {
            push(item);
        }
        else {
            genNode(item, context);
        }
    }
}
// 处理节点类型
function genElement(node, context) {
    const { push, helper } = context;
    const { tag, children, props } = node;
    push(`${helper(CREAETE_ELEMENT_VNODE)}('${tag}', ${props || 'null'}, `);
    for (let item of children) {
        genNode(item, context);
    }
    push(')');
}
// 处理插值中的表达式 此时已经被transform处理过了
function genExpression(node, context) {
    const { push } = context;
    push(`${node.content}`);
}
// 处理插值
function genInterpolation(node, context) {
    const { push, helper } = context;
    push(`${helper(TO_DISPLAY_STRING)}(`);
    genNode(node.content, context);
    push(')');
}
function genText(node, context) {
    const { push } = context;
    push(`'${node.content}'`);
}
// 创建上下文对象
function createCodegenContext() {
    const context = {
        code: '',
        push(source) {
            context.code += source;
        },
        helper(key) {
            return `_${helperMapNames[key]}`;
        }
    };
    return context;
}

function baseParse(content) {
    const context = createParseContext(content);
    return createRoot(parseChildren(context, []));
}
function parseChildren(context, ancestors) {
    const nodes = [];
    while (!isEnded(context, ancestors)) {
        let node;
        let s = context.source;
        if (s.startsWith('{{')) {
            node = paresInterpolation(context);
        }
        else if (s[0] === '<') {
            if (/[a-z]/i.test(s[1])) {
                node = parseElement(context, ancestors);
            }
        }
        if (!node) {
            node = parseText(context);
        }
        nodes.push(node);
    }
    return nodes;
}
// 判断是否结束
function isEnded(context, ancestors) {
    let s = context.source;
    if (s.startsWith('</')) {
        // 只要遇到结束标签就结束  从开始标签里面找
        for (let i = ancestors.length - 1; i >= 0; i--) {
            if (startsWithEndTagOpen(s, ancestors[i].tag)) {
                return true;
            }
        }
    }
    // 没有需要解析的了
    return !s;
}
function parseText(context) {
    let endIndex = context.source.length;
    let endTokens = ['{{', '<']; // 解析text结束标识
    for (let item of endTokens) {
        let index = context.source.indexOf(item);
        if (index !== -1 && index < endIndex) {
            endIndex = index;
        }
    }
    const content = parseTextData(context, endIndex);
    return {
        type: 3 /* TEXT */,
        content
    };
}
function parseTextData(context, length) {
    const content = context.source.slice(0, length);
    advanceBy(context, length);
    return content;
}
function parseElement(context, ancestors) {
    const element = parseTag(context, 0 /* Start */);
    ancestors.push(element);
    element.children = parseChildren(context, ancestors);
    // 判断结束标签是否与开始标签一样
    if (startsWithEndTagOpen(context.source, element.tag)) {
        ancestors.pop();
        parseTag(context, 1 /* End */);
    }
    else {
        throw new Error(`缺少结束标签:${element.tag}`);
    }
    return element;
}
function startsWithEndTagOpen(source, tag) {
    return source.startsWith('</')
        && source.slice(2, 2 + tag.length).toLowerCase() === tag.toLowerCase();
}
function parseTag(context, type) {
    const match = /^\<\/?([a-z]*)/i.exec(context.source);
    const tag = match[1];
    advanceBy(context, match[0].length);
    advanceBy(context, 1); // >右尖括号
    if (type === 1 /* End */)
        return;
    return {
        type: 2 /* ELEMENT */,
        tag
    };
}
function paresInterpolation(context) {
    const openDelimiter = '{{';
    const closeDelimiter = '}}';
    const closeIndex = context.source.indexOf(closeDelimiter, openDelimiter.length);
    // 去除开始部分
    advanceBy(context, openDelimiter.length);
    const rawContentLength = closeIndex - openDelimiter.length;
    const rawContent = parseTextData(context, rawContentLength);
    const content = rawContent.trim();
    // 去除结束部分 }}
    advanceBy(context, closeDelimiter.length);
    return {
        type: 0 /* INTERPOLATION */,
        content: {
            type: 1 /* SIMPLE_EXPRESSION */,
            content: content,
        }
    };
}
// 剪切 向前推
function advanceBy(context, length) {
    context.source = context.source.slice(length);
}
function createRoot(children) {
    return {
        children,
        type: 4 /* ROOT */
    };
}
function createParseContext(content) {
    return {
        source: content
    };
}

function transform(root, options = {}) {
    const context = createTransformContext(root, options);
    transformNode(root, context);
    creteRootCodegen(root);
    // 将节点需要的方法放到节点上， 在生成 code 的时候使用
    root.helpers = [...context.helpers.keys()];
}
function creteRootCodegen(root) {
    let child = root.children[0];
    if (child.type === 2 /* ELEMENT */) {
        root.codegenNode = child.codegenNode;
    }
    else {
        root.codegenNode = root.children[0];
    }
}
function transformNode(node, context) {
    // if (node.type === NodeTypes.TEXT) {
    //     node.content = node.content + ' mini-vue'
    // }
    // 通过外部传入的options实现对节点的处理，扩展性高
    // 进入时执行
    const nodeTransforms = context.nodeTransforms;
    const exitFns = [];
    for (let i = 0; i < nodeTransforms.length; i++) {
        const transform = nodeTransforms[i];
        const onExit = transform(node, context);
        if (onExit) {
            exitFns.push(onExit);
        }
    }
    // 处理节点
    switch (node.type) {
        case 0 /* INTERPOLATION */:
            // 当为插值时添加插值对应的方法
            context.helper(TO_DISPLAY_STRING);
            break;
        case 4 /* ROOT */:
        case 2 /* ELEMENT */:
            traverseChildren(node, context);
            break;
    }
    // 有的需要在退出时执行
    let i = exitFns.length;
    while (i--) {
        exitFns[i]();
    }
}
function traverseChildren(node, context) {
    const children = node.children;
    for (let item of children) {
        transformNode(item, context);
    }
}
function createTransformContext(root, options) {
    const context = {
        root,
        nodeTransforms: (options === null || options === void 0 ? void 0 : options.nodeTransforms) || [],
        helpers: new Map(),
        helper(key) {
            context.helpers.set(key, 1);
        }
    };
    return context;
}

function createVNodeCall(context, tag, props, children) {
    context.helper(CREAETE_ELEMENT_VNODE);
    return {
        type: 2 /* ELEMENT */,
        tag,
        props,
        children
    };
}

function transformELement(node, context) {
    if (node.type === 2 /* ELEMENT */) {
        return () => {
            // tag
            const vnodeTag = node.tag;
            // props
            let vnodeProps;
            // children
            const children = node.children;
            let vnodeChildren = children;
            node.codegenNode = createVNodeCall(context, vnodeTag, vnodeProps, vnodeChildren);
        };
    }
}

function transformExpression(node) {
    if (node.type === 0 /* INTERPOLATION */) {
        procesExpression(node.content);
    }
}
function procesExpression(node) {
    node.content = `_ctx.${node.content}`;
}

function isText(node) {
    return node.type === 3 /* TEXT */ || node.type === 0 /* INTERPOLATION */;
}

// 将element 中连续的 text 和 插值 生成 组合类型节点
// 为了处理 text 和 插值 生成代码之间的加号
function transformText(node) {
    if (node.type === 2 /* ELEMENT */) {
        return () => {
            // 退出后执行
            let { children } = node;
            let currentContainer;
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                if (isText(child)) {
                    for (let j = i + 1; j < children.length; j++) {
                        const next = children[j];
                        if (isText(next)) {
                            if (!currentContainer) {
                                // children[i] 替换
                                currentContainer = children[i] = {
                                    type: 5 /* COMPOUND_EXPRESSION */,
                                    children: [child]
                                };
                                children.splice(j, 1);
                                j--; // 被剔除了所以要先减
                            }
                            currentContainer.children.push(' + ');
                            currentContainer.children.push(next);
                        }
                        else {
                            currentContainer = undefined;
                            break;
                        }
                    }
                }
            }
        };
    }
}

function baseCompiler(template) {
    const ast = baseParse(template);
    transform(ast, {
        // 执行顺序 transformExpression  transformText  transformELement
        nodeTransforms: [transformExpression, transformELement, transformText]
    });
    return genreate(ast);
}

function compileToFunction(template) {
    const { code } = baseCompiler(template);
    const render = new Function("Vue", code)(runtimeDom);
    return render;
}
// 将 compiler 传入到 runtime-core component 中 
// runtime-core 不依赖于compiler-core
registerRuntimeCompiler(compileToFunction);

export { createApp, createVNode as createElementVnode, createRenderer, createTextVNode, effect, getCurrentInstance, h, inject, isProxy, isReactive, isReadonly, isRef, nextTick, provide, proxyRefs, reactive, readonly, ref, registerRuntimeCompiler, renderSlots, shallowReadonly, stop, toDisplayString, unRef };
