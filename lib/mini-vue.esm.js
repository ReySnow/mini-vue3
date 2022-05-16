const extend = Object.assign;
const isObject = (val) => {
    return val !== null && typeof val === 'object';
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

const targetMap = new Map();
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

// 创建组件实例
function createComponentInstance(vnode) {
    const instance = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},
        emit: () => { },
        slots: {}
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
function setupStatefulComponent(instance) {
    const component = instance.type;
    // render 的 ctx 
    // 通过代理对象取值实现在 render 中通过 this.xx 取值
    instance.proxy = new Proxy({ _: instance }, publicInstanceHandlers);
    const { setup } = component;
    if (setup) {
        // setup 返回对象或函数
        const setupResult = setup(shallowReadonly(instance.props), {
            emit: instance.emit,
        });
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    if (typeof setupResult === 'object') {
        instance.setupState = setupResult;
    }
    finishComponent(instance);
}
function finishComponent(instance) {
    const component = instance.type;
    if (component.render) {
        instance.render = component.render;
    }
}

const Fragment = Symbol('Fragment');
const Text = Symbol('Text');
// 创建虚拟节点
function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        el: null,
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

function render(vnode, container) {
    // 递归处理
    patch(vnode, container);
}
function patch(vnode, container) {
    // 判断vnode类型 component element
    const { shapeFlag, type } = vnode;
    switch (type) {
        case Fragment:
            processFragment(vnode, container);
            break;
        case Text:
            processText(vnode, container);
            break;
        default:
            if (shapeFlag & 1 /* ELELEMT */) {
                processElement(vnode, container);
            }
            else if (shapeFlag & 2 /* STATEFUL_COMPONENT */) {
                processComponent(vnode, container);
            }
    }
}
// 处理fragment，只渲染children
function processFragment(vnode, container) {
    mountChildren(vnode, container);
}
// 渲染text文本
function processText(vnode, container) {
    const { children } = vnode;
    const textNode = vnode.el = document.createTextNode(children);
    container.append(textNode);
}
// 处理类型为element的vnode
function processElement(vnode, container) {
    mountElement(vnode, container);
}
// 挂载elememt
function mountElement(vnode, container) {
    const { children, props, type, shapeFlag } = vnode;
    // type = div p span  赋值给vnode.el -> this.$el 取值
    const el = vnode.el = document.createElement(type);
    if (shapeFlag & 4 /* TEXT_CHILDREN */) {
        el.textContent = children;
    }
    else if (shapeFlag & 8 /* ARRAY_CHILDREND */) {
        mountChildren(vnode, el);
    }
    for (let key in props) {
        const val = props[key];
        const isOn = (key) => /^on[A-Z]/.test(key);
        if (isOn(key)) {
            const even = key.slice(2).toLocaleLowerCase();
            el.addEventListener(even, val);
        }
        else {
            el.setAttribute(key, val);
        }
    }
    container.append(el);
}
// 处理子节点
function mountChildren(vnode, container) {
    vnode.children.forEach(element => {
        // 递归处理子节点
        patch(element, container);
    });
}
// 处理类型为component的vnode
function processComponent(vnode, container) {
    mountComponent(vnode, container);
}
// 挂载component
function mountComponent(vnode, container) {
    // 创建组件实例
    const instance = createComponentInstance(vnode);
    setupComponent(instance);
    setupRenderEffect(instance, container);
}
function setupRenderEffect(instance, container) {
    // finishComponent 中设置了render
    // subtree 就是虚拟节点
    // 将proxy绑定到this上
    const subtree = instance.render.call(instance.proxy);
    patch(subtree, container);
    instance.vnode.el = subtree.el;
}

function createApp(rootComponent) {
    return {
        mount(rootContainer) {
            // component 转换成vnode 逻辑基于vnode操作
            const vnode = createVNode(rootComponent);
            render(vnode, rootContainer);
        }
    };
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

export { createApp, createTextVNode, h, renderSlots };
