import { ElementNode, TextNode } from './types';

export function render(
  element: ElementNode | TextNode | (() => ElementNode | TextNode),
  root: HTMLElement
) {
  if (typeof element == 'function') element = element();
  const dom =
    element.type == 'TEXT_ELEMENT'
      ? document.createTextNode('')
      : document.createElement(element.type);

  const isProperty = (key: string) => key !== 'children';
  Object.keys(element.props)
    .filter(isProperty)
    .forEach((propName) => {
      // @ts-ignore
      dom[propName] = element.props[propName];
    });

  if (typeof element.props.children == 'object' && dom instanceof HTMLElement) {
    element.props.children.forEach((child) => render(child, dom));
  }

  root.appendChild(dom);
}

export function createTextElement(nodeValue: string): TextNode {
  return {
    type: 'TEXT_ELEMENT',
    props: { nodeValue },
  };
}

export function createElement(
  type: keyof HTMLElementTagNameMap,
  props: Record<string, string | ElementNode | TextNode>,
  children: (ElementNode | TextNode | string)[] | string
): ElementNode {
  return {
    type: type,
    props: {
      ...props,
      children:
        typeof children == 'string'
          ? [createTextElement(children)]
          : children.map((child) =>
              typeof child == 'string' ? createTextElement(child) : child
            ),
    },
  };
}
