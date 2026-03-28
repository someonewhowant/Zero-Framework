export  function h(tag, props, ...children) {
    return { tag, props: props || {}, children: children.flat() };
}


export class Zero {
    constructor(props) {
        this.props = props || {};
        this.state = {};
        this._vdom = null;
        this._dom = null;
        this._updateQueued = false;
    }

    // --- Lifecycle Method Stubs ---
    onCreated() {}
    onMounted(element) {}
    onUpdated() {}
    onUnmounted() {}

    // --- Core Methods ---
    render() {
        throw new Error("Component must implement a render() method.");
    }
}

// 3. DOM Creation
function createElement(vnode) {
    if (typeof vnode === 'string' || typeof vnode === 'number') {
        return document.createTextNode(vnode.toString());
    }

    const { tag, props, children } = vnode;
    const el = document.createElement(tag);
    updateProps(el, props);

    children.forEach(child => {
        el.appendChild(createElement(child));
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
        parent.appendChild(newEl);
    
        return;
    }

    if (newVNode == null) {
      
        const component = oldVNode.tag;
        if (component instanceof Zero) {
            component.onUnmounted();
        }
        el.remove();
        return;
    }

    const isDifferent =
        typeof newVNode !== typeof oldVNode ||
        (typeof newVNode === 'string' && newVNode !== oldVNode) ||
        oldVNode.tag !== newVNode.tag;

    if (isDifferent) {
        const component = oldVNode.tag;

        if (component instanceof Zero) {
            component.onUnmounted();
        }
        const newEl = createElement(newVNode);
        parent.replaceChild(newEl, el);
        return;
    }

    updateProps(el, newVNode.props, oldVNode.props);
    diffChildren(el, newVNode.children, oldVNode.children);
    el._vdom = newVNode;
}


function diffChildren(parent, newChildren, oldChildren) {
    // Keyed reconciliation
    const oldKeyedChildren = {};
    const newKeyedChildren = {};
    const oldUnkeyedChildren = [];
    const newUnkeyedChildren = [];

    oldChildren.forEach(child => {
        const key = child.props.key;
        if (key != null) {
            oldKeyedChildren[key] = child;
        } else {
            oldUnkeyedChildren.push(child);
        }
    });
    
    newChildren.forEach(child => {
        const key = child.props.key;
        if (key != null) {
            newKeyedChildren[key] = child;
        } else {
            newUnkeyedChildren.push(child);
        }
    });

    
    const maxUnkeyedLength = Math.max(oldUnkeyedChildren.length, newUnkeyedChildren.length);
    for (let i = 0; i < maxUnkeyedLength; i++) {
        diff(parent, newUnkeyedChildren[i], oldUnkeyedChildren[i], i);
    }
    
    // Diff keyed children
    const parentEl = parent;
    const oldKeyedMap = new Map();
    Array.from(parentEl.children).forEach(child => {
        const vdom = child._vdom;
        if (vdom && vdom.props && vdom.props.key) {
            oldKeyedMap.set(vdom.props.key, child);
        }
    });

    let lastIndex = 0;
    for (const key in newKeyedChildren) {
        const newVChild = newKeyedChildren[key];
        const oldVChild = oldKeyedChildren[key];
        
        if (oldVChild) {
            
            const el = oldKeyedMap.get(key);
            updateProps(el, newVChild.props, oldVChild.props);
            diffChildren(el, newVChild.children, oldVChild.children);
            el._vdom = newVChild;
            oldKeyedMap.delete(key);
        } else {
            
            const newEl = createElement(newVChild);
            parentEl.appendChild(newEl);
        }
    }
    
    // Remove old keyed children that no longer exist
    oldKeyedMap.forEach(el => el.remove());
}



export function mount(component, target) {
    // Lifecycle: onCreated
    component.onCreated();

    // Initial render
    const vdom = component.render();
    const dom = createElement(vdom);

    // Store references on the component instance
    component._vdom = vdom;
    component._dom = dom;

    target.innerHTML = ''; // Clear the target element
    target.appendChild(dom);

    // Lifecycle: onMounted
    component.onMounted(dom);

    // Create the reactive proxy for the state
    component.state = new Proxy(component.state || {}, {
        set: (state, property, value) => {
            state[property] = value;

            if (!component._updateQueued) {
                component._updateQueued = true;
                // Batch updates to the next animation frame
                requestAnimationFrame(() => {
                    const newVdom = component.render();
                    diff(target, newVdom, component._vdom);
                    component._vdom = newVdom;
                    component._updateQueued = false;
                    
                    // Lifecycle: onUpdated
                    component.onUpdated();
                });
            }
            return true;
        }
    });

    return component;
}
