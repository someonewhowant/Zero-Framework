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


console.log(h("div", { id: "app" }, h("h1", null, "Hello World")));