
// =======================
// JSX-like API
// =======================

export function createElement(type: any, props: any, ...children: any[]): any {
  return {
    type,
    props: {
      ...props,
      children: children.flat().map(child =>
        typeof child === "object" ? child : createTextElement(child)
      ),
    },
  };
}

function createTextElement(text: string) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  };
}