/*
 * h function - creates a virtual DOM node
 * @param {string} tag - HTML tag name
 * @param {object} props - HTML attributes
 * @param {...*} children - Child nodes
 * @returns {object} Virtual DOM node
 */
function h(tag, props, ...children) {
  return { tag, props: props || {}, children: children.flat() };
}


class Zero {
  construtor(props) {
    this.props = props || {};
    this.state = {};
    this._vdom = null;
    this._dom = null;
    this._updateQueued = false;

  }

  //методы жизненного цикла
  onCreated() { }
  onMounted() { }
  onUpdated() { }
  onUnmounted() { }

  //метод рендера
  render() {
    throw new Error("Component must implement render method");
  }




}
/*
 *createElement - creates a DOM node from a virtual DOM node
 *@param {object} vnode - Virtual DOM node
 *@returns {Node} DOM node
 */
function createElement(vnode) {
  if (typeof vnode === 'string' || typeof vnode === 'number') {
    return document.createTextNode(vnode);
  }

  const { tag, props, children } = vnode;

  const el = document.createElement(tag);

  updateProps(el, props);

  children.forEach(child => {
    el.appendChild(createElement(child));
  })

  //сохраняем vnode для последующего сравнения
  el._vdom = vnode;

  return el;
}

/*
 *updateProps - updates the properties of a DOM node
 *@param {Node} el - DOM node
 *@param {object} newProps - New properties
 *@param {object} oldProps - Old properties
 *@returns {void}
 */
function updateProps(el, newProps = {}, oldProps = {}) {
  const updated = { ...oldProps, ...newProps };

  Object.keys(updated).forEach(key => {
    const oldValue = oldProps[key];
    const newValue = newProps[key];

    if (newValue === oldValue) return;

    if (key.startsWith('on')) {
      const event = key.slice(2).toLowerCase();

      if (oldValue) {
        el.removeEventListener(event, oldValue);
      }

      if (newValue) {
        el.addEventListener(event, newValue);
      }
    } else if (newValue === null || newValue === false) {
      el.removeAttribute(key);
    } else {
      el.setAttribute(key, newValue);
    }
  })
}