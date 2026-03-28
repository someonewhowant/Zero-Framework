function diff(parent, newVNode, oldVNode, index = 0) {
    const el = parent.childNodes[index];
    if (oldVNode == null) {
        const newEl = createElement(newVNode);
        parent.appendChild(newEl);
        // Note: onMounted for components is handled in mount()
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
        // Note: onMounted for components is handled in mount()
        return;
    }

    // Case 4: Same tag, update props and diff children
    updateProps(el, newVNode.props, oldVNode.props);
    diffChildren(el, newVNode.children, oldVNode.children);

    // Update the vnode reference
    el._vdom = newVNode;
}


function diffChildren(parent, newChildren, oldChildren) {
    
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
            // Patch existing
            const el = oldKeyedMap.get(key);
            updateProps(el, newVChild.props, oldVChild.props);
            diffChildren(el, newVChild.children, oldVChild.children);
            el._vdom = newVChild;
            oldKeyedMap.delete(key);
        } else {
            // Add new
            const newEl = createElement(newVChild);
            parentEl.appendChild(newEl);
        }
    }
    
    oldKeyedMap.forEach(el => el.remove());
}



