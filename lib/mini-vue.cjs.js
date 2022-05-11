'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const extend = Object.assign;
const isObject = (val) => {
    return val !== null && typeof val === 'object';
};
const isArray = Array.isArray;
const hasOwn = (val, key) => Object.prototype.hasOwnProperty.call(val, key);

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

function initprops(instance, raw) {
    instance.props = raw || {};
}

const publicPropertiesMap = {
    $el: i => i.vnode.el
};
const publicInstanceHandlers = {
    get({ _: instance }, key) {
        // 处理this取值
        const { setupState, props } = instance;
        if (key in setupState) {
            return setupState[key];
        }
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

// 创建组件实例
function createComponentInstance(vnode) {
    const instance = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {}
    };
    return instance;
}
function setupComponent(instance) {
    // 初始化props
    initprops(instance, instance.vnode.props);
    // initSlots
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
        const setupResult = setup(shallowReadonly(instance.props));
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

function render(vnode, container) {
    // 递归处理
    patch(vnode, container);
}
function patch(vnode, container) {
    // 判断vnode类型 component element
    const { shapeFlag } = vnode;
    if (shapeFlag & 1 /* ELELEMT */) {
        processElement(vnode, container);
    }
    else if (shapeFlag & 2 /* STATEFUL_COMPONENT */) {
        processComponent(vnode, container);
    }
}
// 处理类型为element的vnode
function processElement(vnode, container) {
    mountElement(vnode, container);
}
// 挂载elememt
function mountElement(vnode, container) {
    const { children, props, type, shapeFlag } = vnode;
    // type = div p span
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
    return vnode;
}
function getShapeFlage(type) {
    return typeof type === 'string'
        ? 1 /* ELELEMT */
        : 2 /* STATEFUL_COMPONENT */;
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

exports.createApp = createApp;
exports.h = h;
