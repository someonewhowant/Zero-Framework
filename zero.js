export function h(tag, props, ...children) {
    return { tag, props: props || {}, children: children.flat().filter(c => c != null) };
}

export class Zero {
    constructor(props) {
        this.props = props || {};
        this.state = {};
        this._vdom = null;
        this._dom = null;
        this._updateQueued = false;
    }

    onCreated() { }
    onMounted(element) { }
    onUpdated() { }
    onUnmounted() { }
    render() {
        throw new Error("Component must implement a render() method.");
    }
}

function createElement(vnode) {
    if (vnode == null) return null;
    if (typeof vnode === 'string' || typeof vnode === 'number') {
        return document.createTextNode(vnode.toString());
    }

    const { tag, props, children } = vnode;

    // Handle functional components
    if (typeof tag === 'function') {
        const subVNode = tag(props || {});
        const el = createElement(subVNode);
        if (el) {
            el._vdom = vnode;
            el._componentVNode = subVNode;
        }
        return el;
    }

    const el = document.createElement(tag);
    updateProps(el, props);

    children.forEach(child => {
        const childEl = createElement(child);
        if (childEl) el.appendChild(childEl);
    });

    el._vdom = vnode;
    return el;
}

function updateProps(el, newProps = {}, oldProps = {}) {
    const allProps = { ...oldProps, ...newProps };

    Object.keys(allProps).forEach(key => {
        const oldValue = oldProps[key];
        const newValue = newProps[key];

        if (newValue === oldValue) return;

        if (key.startsWith('on')) {
            const eventName = key.slice(2).toLowerCase();
            if (oldValue) el.removeEventListener(eventName, oldValue);
            if (newValue) el.addEventListener(eventName, newValue);
        } else if (key in el && !(el instanceof SVGElement)) {
            el[key] = newValue == null ? '' : newValue;
        } else if (newValue == null || newValue === false) {
            el.removeAttribute(key);
        } else {
            el.setAttribute(key, newValue);
        }
    });
}

function diff(parent, newVNode, oldVNode, index = 0) {
    const el = parent.childNodes[index];

    if (oldVNode == null) {
        const newEl = createElement(newVNode);
        if (newEl) parent.appendChild(newEl);
        return;
    }

    if (newVNode == null) {
        if (el) el.remove();
        return;
    }

    // Handle structural differences or tag changes
    if (typeof newVNode !== typeof oldVNode ||
        (typeof newVNode === 'string' && newVNode !== oldVNode) ||
        oldVNode.tag !== newVNode.tag) {
        const newEl = createElement(newVNode);
        if (el) {
            parent.replaceChild(newEl, el);
        } else {
            parent.appendChild(newEl);
        }
        return;
    }

    // If it's a DOM element
    if (typeof newVNode.tag === 'string') {
        updateProps(el, newVNode.props, oldVNode.props);
        diffChildren(el, newVNode.children, oldVNode.children);
    }
    // If it's a functional component
    else if (typeof newVNode.tag === 'function') {
        const newSubVNode = newVNode.tag(newVNode.props || {});
        diff(parent, newSubVNode, el._componentVNode, index);
        el._componentVNode = newSubVNode;
    }

    if (el) el._vdom = newVNode;
}

function diffChildren(parent, newChildren, oldChildren) {
    const oldKeyedChildren = {};
    const newKeyedChildren = {};
    const oldUnkeyedChildren = [];
    const newUnkeyedChildren = [];

    oldChildren.forEach(child => {
        const key = child && child.props && child.props.key;
        if (key != null) {
            oldKeyedChildren[key] = child;
        } else {
            oldUnkeyedChildren.push(child);
        }
    });

    newChildren.forEach(child => {
        const key = child && child.props && child.props.key;
        if (key != null) {
            newKeyedChildren[key] = child;
        } else {
            newUnkeyedChildren.push(child);
        }
    });

    // Handle unkeyed children by index
    const maxUnkeyedLength = Math.max(oldUnkeyedChildren.length, newUnkeyedChildren.length);
    for (let i = 0; i < maxUnkeyedLength; i++) {
        diff(parent, newUnkeyedChildren[i], oldUnkeyedChildren[i], i);
    }

    // Handle keyed children
    const parentEl = parent;
    const oldKeyedNodes = new Map();
    Array.from(parentEl.childNodes).forEach(node => {
        const vdom = node._vdom;
        if (vdom && vdom.props && vdom.props.key != null) {
            oldKeyedNodes.set(vdom.props.key, node);
        }
    });

    for (const key in newKeyedChildren) {
        const newVChild = newKeyedChildren[key];
        const oldVChild = oldKeyedChildren[key];

        if (oldVChild) {
            const node = oldKeyedNodes.get(key);
            if (node) {
                // Find current index of this node
                const currentIndex = Array.from(parentEl.childNodes).indexOf(node);
                diff(parentEl, newVChild, oldVChild, currentIndex);
                oldKeyedNodes.delete(key);
            }
        } else {
            const newEl = createElement(newVChild);
            if (newEl) parentEl.appendChild(newEl);
        }
    }

    oldKeyedNodes.forEach(node => node.remove());
}

export function mount(component, target) {
    const createProxy = (obj) => {
        return new Proxy(obj, {
            set: (state, property, value) => {
                state[property] = value;
                if (!component._updateQueued) {
                    component._updateQueued = true;
                    requestAnimationFrame(() => {
                        const newVdom = component.render();
                        diff(target, newVdom, component._vdom);
                        component._vdom = newVdom;
                        component._updateQueued = false;
                        component.onUpdated();
                    });
                }
                return true;
            }
        });
    };

    component.state = createProxy(component.state || {});
    component.onCreated();

    const vdom = component.render();
    const dom = createElement(vdom);

    component._vdom = vdom;
    component._dom = dom;

    target.innerHTML = '';
    target.appendChild(dom);

    component.onMounted(dom);

    return component;
}
