
// =======================
// Global Variables
// =======================

import { FiberNode, Hook } from "./types";

let nextUnitOfWork: FiberNode | null = null;
let wipRoot: FiberNode | null = null;       // Work-In-Progress root
let currentRoot: FiberNode | null = null;     // Last committed root
let deletions: FiberNode[] = [];              // Fibers marked for deletion

// For hooks:
let wipFiber: FiberNode | null = null; // Currently processing fiber for hooks
let hookIndex = 0;

// =======================
// Work Loop (Scheduler)
// =======================

function workLoop(deadline: IdleDeadline) {
  let shouldYield = false;

  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }

  if (!nextUnitOfWork && wipRoot) {
    commitRoot(); // When work is done, commit changes to the DOM
  }

  requestIdleCallback(workLoop);
}

requestIdleCallback(workLoop);

// =======================
// Fiber Processing & Reconciliation
// =======================

function performUnitOfWork(fiber: FiberNode): FiberNode | null {
  // Set the current fiber for hooks
  wipFiber = fiber;
  hookIndex = 0;

  // If the fiber represents a function component, run it to get children
  if (typeof fiber.type === "function") {
    // Execute the function component to get its element
    const children = [(fiber.type as Function)(fiber.props)];
    reconcileChildren(fiber, children);
  } else {
    // For host components (like 'div', 'h1', etc.)
    if (!fiber.dom) {
      fiber.dom = createDom(fiber);
    }
    reconcileChildren(fiber, fiber.props.children);
  }

  // Return next unit of work (depth-first traversal)
  if (fiber.child) return fiber.child;
  let nextFiber: FiberNode | null = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) return nextFiber.sibling;
    nextFiber = nextFiber.parent;
  }
  return null;
}

function reconcileChildren(wipFiber: FiberNode, children: any[]) {
  let index = 0;
  let oldFiber = wipFiber.alternate ? wipFiber.alternate.child : null;
  let prevSibling: FiberNode | null = null;

  while (index < children.length || oldFiber !== null) {
    const element = children[index];
    let newFiber: FiberNode | null = null;
    const sameType = oldFiber && element && element.type === oldFiber.type;

    if (sameType) {
      // Update the node
      newFiber = {
        type: oldFiber!.type,
        props: element.props,
        dom: oldFiber!.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: "UPDATE",
        child: null,
        sibling: null,
      };
    }
    if (element && !sameType) {
      // Add new node
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectTag: "PLACEMENT",
        child: null,
        sibling: null,
      };
    }
    if (oldFiber && !sameType) {
      // Mark old node for deletion
      oldFiber.effectTag = "DELETION";
      deletions.push(oldFiber);
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }

    // build the new fiber tree
    if (index === 0) {
      wipFiber.child = newFiber;
    } else if (prevSibling && newFiber) {
      prevSibling.sibling = newFiber;
    }

    // traverse the tree
    prevSibling = newFiber;
    index++;
  }
}

// =======================
// DOM Creation & Updates
// =======================

function createDom(fiber: FiberNode): HTMLElement | Text {
  const dom =
    fiber.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type as string);

  updateDom(dom, {}, fiber.props);
  return dom;
}

function updateDom(dom: HTMLElement | Text, prevProps: any, nextProps: any) {
  // Remove old or changed event listeners
  Object.keys(prevProps)
    .filter(name => name.startsWith("on"))
    .forEach(name => {
      const eventType = name.toLowerCase().substring(2);
      (dom as any).removeEventListener(eventType, prevProps[name]);
    });
  // Remove old properties
  Object.keys(prevProps)
    .filter(name => name !== "children" && !name.startsWith("on"))
    .forEach(name => {
      (dom as any)[name] = "";
    });
  // Set new properties
  Object.keys(nextProps)
    .filter(name => name !== "children" && !name.startsWith("on"))
    .forEach(name => {
      (dom as any)[name] = nextProps[name];
    });
  // Add event listeners
  Object.keys(nextProps)
    .filter(name => name.startsWith("on"))
    .forEach(name => {
      const eventType = name.toLowerCase().substring(2);
      (dom as any).addEventListener(eventType, nextProps[name]);
    });
}

// =======================
// Commit Phase
// =======================

function commitRoot() {
  deletions.forEach(commitWork);
  commitWork(wipRoot!.child);
  currentRoot = wipRoot;
  wipRoot = null;
}

function commitWork(fiber: FiberNode | null) {
  if (!fiber) return;
  let domParentFiber = fiber.parent;
  while (domParentFiber && !domParentFiber.dom) {
    domParentFiber = domParentFiber.parent;
  }
  const domParent = domParentFiber?.dom;
  if (!domParent) return;

  if (fiber.effectTag === "PLACEMENT" && fiber.dom != null) {
    domParent.appendChild(fiber.dom);
  } else if (fiber.effectTag === "UPDATE" && fiber.dom != null) {
    updateDom(fiber.dom, fiber.alternate ? fiber.alternate.props : {}, fiber.props);
  } else if (fiber.effectTag === "DELETION") {
    commitDeletion(fiber, domParent as HTMLElement);
    return; // No need to process children of a deleted node.
  }
  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

function commitDeletion(fiber: FiberNode, domParent: HTMLElement) {
  if (fiber.dom) {
    domParent.removeChild(fiber.dom);
  } else {
    commitDeletion(fiber.child!, domParent);
  }
}

// =======================
// Render Function (Entry Point)
// =======================

export function render(element: any, container: HTMLElement) {
  wipRoot = {
    dom: container,
    props: { children: [element] },
    parent: null,
    child: null,
    sibling: null,
    alternate: currentRoot,
    type: null,
  };
  deletions = [];
  nextUnitOfWork = wipRoot;
}

// =======================
// HOOKS IMPLEMENTATION (useState)
// =======================

export function useState<T>(initial: T): [T, (action: (prev: T) => T) => void] {
  // Get the old hook from the alternate fiber (if available)
  const oldHook =
    wipFiber?.alternate && wipFiber.alternate.memoizedState
      ? wipFiber.alternate.memoizedState[hookIndex]
      : undefined;
  const hook: Hook = {
    state: oldHook ? oldHook.state : initial,
    queue: oldHook ? oldHook.queue.slice() : [],
  };

  // Process queued state updates
  hook.queue.forEach((action: (prev: T) => T) => {
    hook.state = action(hook.state);
  });
  hook.queue = [];

  // Save the hook to the current fiber
  if (wipFiber) {
    if (!wipFiber.memoizedState) {
      wipFiber.memoizedState = [];
    }
    wipFiber.memoizedState[hookIndex] = hook;
  }

  const setState = (action: (prev: T) => T) => {
    hook.queue.push(action);
    // Schedule a re-render by setting a new work-in-progress root
    wipRoot = {
      dom: currentRoot!.dom,
      props: currentRoot!.props,
      alternate: currentRoot,
      parent: null,
      child: null,
      sibling: null,
      type: null,
      memoizedState: [],
    };
    nextUnitOfWork = wipRoot;
  };

  hookIndex++;
  return [hook.state, setState];
}

// (For brevity, useEffect and other hooks are not implemented in full here.)
