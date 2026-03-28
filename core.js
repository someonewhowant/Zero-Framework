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

    // Diff unkeyed children (simple, by index)
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
    
    // Remove old keyed children that no longer exist
    oldKeyedMap.forEach(el => el.remove());
}
