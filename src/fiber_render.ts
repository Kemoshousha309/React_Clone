import { FiberNode } from "./types";

let nextUnitOfWork: FiberNode | null = null;

function workLoop(deadline: IdleDeadline) {
  let shouldYield = false;

  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }

  requestIdleCallback(workLoop);
}

requestIdleCallback(workLoop);


function performUnitOfWork(fiber: FiberNode): FiberNode | null {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
    if (fiber.parent) {
      fiber.parent.dom?.appendChild(fiber.dom);
    }
  }

  let prevSibling: FiberNode | null = null;
  fiber.props.children.forEach((child, index) => {
    const newFiber: FiberNode = {
      type: child.type,
      props: child.props,
      parent: fiber,
      dom: null,
      child: null,
      sibling: null,
    };

    if (index === 0) {
      fiber.child = newFiber;
    } else if (prevSibling) {
      prevSibling.sibling = newFiber;
    }

    prevSibling = newFiber;
  });

  if (fiber.child) return fiber.child;
  let nextFiber: FiberNode | null = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) return nextFiber.sibling;
    nextFiber = nextFiber.parent;
  }

  return null;
}


function createDom(fiber: FiberNode): HTMLElement | Text {
  const dom =
    fiber.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type as string);

  Object.keys(fiber.props)
    .filter(key => key !== "children")
    .forEach(name => {
      (dom as any)[name] = fiber.props[name];
    });

  return dom;
}


export function render(element: FiberNode, container: HTMLElement) {
  // set the root of the fiber tree to trigger the work loop
  nextUnitOfWork = { // the root fiber node 
    dom: container,
    props: { children: [element] },
    parent: null,
    child: null,
    sibling: null,
    type: null,
  };
}


// jsx
export function createElement(type: string, props: any, ...children: any[]): FiberNode {
  return {
    type,
    props: {
      ...props,
      children: children.map(child =>
        typeof child === "object" ? child : createTextElement(child)
      ),
    },
    dom: null,
    parent: null,
    child: null,
    sibling: null,
  };
}

function createTextElement(text: string): FiberNode {
  return {
    type: "TEXT_ELEMENT",
    props: { nodeValue: text, children: [] },
    dom: null,
    parent: null,
    child: null,
    sibling: null,
  };
}
