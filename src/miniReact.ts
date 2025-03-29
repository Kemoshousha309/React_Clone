import { FiberNode } from "./types";
import { createDom } from "./utils";

// Render Phase 
let nextUnitOfWork: FiberNode | null = null;
let wipRoot: FiberNode | null = null;
let currentRoot: FiberNode | null = null; // Last committed fiber tree
let deletions: FiberNode[] = []; // Store nodes to delete

// here unit tests are required 
export function performUnitOfWork(fiber: FiberNode): FiberNode | null {
  // Step 1: Create DOM (only in-memory, not attached to parent)
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }

  // Step 2: Reconcile children (Compare old fiber tree)
  let prevSibling: FiberNode | null = null;
  let oldFiber = fiber.alternate?.child;
  
  fiber.props.children.forEach((child: FiberNode, index: number) => {
    const isSameType = oldFiber && oldFiber.type === child.type;
    
    let newFiber: FiberNode;
    if (isSameType) {
      // ✅ Update existing node
      newFiber = {
        ...oldFiber!,
        props: child.props,
        alternate: oldFiber ?? null,  // ✅ Link old and new fiber
        effectTag: "UPDATE",
      };
    } else {
      // ❌ Replace old node (Delete old, Create new)
      if (oldFiber) {
        deletions.push(oldFiber);
        oldFiber.effectTag = "DELETION"; // Mark for deletion
      }
      newFiber = {
        type: child.type,
        props: child.props,
        dom: null,
        parent: fiber,
        child: null,
        sibling: null,
        alternate: oldFiber ?? null,  // ✅ Link old and new fiber
        effectTag: "PLACEMENT",
      };
    }

    // linking children and siblings
    if (index === 0) {
      fiber.child = newFiber;
    } else if (prevSibling) {
      prevSibling.sibling = newFiber;
    }
    
    prevSibling = newFiber;
    oldFiber = oldFiber?.sibling || null;
  });
  
  // deletions leftover fiber nodes 
  while (oldFiber) {
    deletions.push(oldFiber);  // ❌ Remove leftover old nodes
    oldFiber = oldFiber.sibling;  // Move to next old node
  }
  

  // Step 3: Return next unit of work (Depth-First Search)
  if (fiber.child) return fiber.child;
  let nextFiber: FiberNode | null = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) return nextFiber.sibling;
    nextFiber = nextFiber.parent;
  }
  
  return null;
}




// Commit Phase
function commitWork(fiber: FiberNode | null) {
  if (!fiber) return; // Base case: Stop when there are no more fibers.

  const parentDom = fiber.parent?.dom; // Find the parent DOM element
  if (!parentDom) return; // If there’s no parent, do nothing.

  if (fiber.effectTag === "PLACEMENT" && fiber.dom) {
    // 🌱 New node → Append to parent DOM
    parentDom.appendChild(fiber.dom);
  } else if (fiber.effectTag === "UPDATE" && fiber.dom) {
    // 🔄 Update existing node
    updateDom(fiber.dom, fiber.alternate?.props || {}, fiber.props);
  } else if (fiber.effectTag === "DELETION") {
    // ❌ Delete node
    commitDeletion(fiber);
  }

  // 🚀 Recursively commit children and siblings
  commitWork(fiber.child);
  commitWork(fiber.sibling);
}



// Commit utils

function commitDeletion(fiber: FiberNode) {
  if (fiber.dom && fiber.parent?.dom) {
    fiber.parent.dom.removeChild(fiber.dom); // Directly remove DOM node if it exists
  } 
}

function updateDom(
  dom: HTMLElement | Text, // Can be an element or a text node
  prevProps: Record<string, any>,
  nextProps: Record<string, any>
) {
  if (dom instanceof Text) {
    // 📝 If it's a Text node, just update its content
    const newText = nextProps.nodeValue || "";
    if (dom.nodeValue !== newText) {
      dom.nodeValue = newText;
    }
    return; // No need to handle events, attributes, styles
  }

  // 1️⃣ Remove old event listeners
  Object.keys(prevProps).forEach((name) => {
    if (name.startsWith("on") && !(name in nextProps)) {
      const eventType = name.toLowerCase().substring(2) as keyof HTMLElementEventMap;
      dom.removeEventListener(eventType, prevProps[name]);
    }
  });

  // 2️⃣ Update properties & attributes
  Object.keys(nextProps).forEach((name) => {
    const value = nextProps[name];

    if (name.startsWith("on")) {
      // 🎯 Add new event listeners
      const eventType = name.toLowerCase().substring(2) as keyof HTMLElementEventMap;
      dom.addEventListener(eventType, value);
    } else if (name === "className") {
      // 🎭 Convert React's className to class
      (dom as HTMLElement).setAttribute("class", value);
    } else if (name === "style" && typeof value === "object") {
      // 🎨 Update inline styles
      Object.assign((dom as HTMLElement).style, value);
    } else if (name !== "children") {
      // 🏷 Update other attributes
      if (prevProps[name] !== value) {
        (dom as HTMLElement).setAttribute(name, String(value));
      }
    }
  });

  // 3️⃣ Remove old attributes that no longer exist
  Object.keys(prevProps).forEach((name) => {
    if (!(name in nextProps) && name !== "children") {
      (dom as HTMLElement).removeAttribute(name);
    }
  });
}


function commitRoot() {
  deletions.forEach(commitDeletion);
  if(wipRoot?.child) {
    commitWork(wipRoot?.child);
  }
  currentRoot = wipRoot;
  wipRoot = null;
}


function workLoop(deadline: IdleDeadline) {
  let shouldYield = false;

  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }

  if (!nextUnitOfWork && wipRoot) {
    commitRoot(); // Apply DOM changes
  }

  requestIdleCallback(workLoop);
}

requestIdleCallback(workLoop);


export function render(element: FiberNode, container: HTMLElement) {
  wipRoot = {
    dom: container,
    props: { children: [element] },
    parent: null,
    child: null,
    sibling: null,
    alternate: currentRoot,
    type: null
  };
  deletions = [];
  nextUnitOfWork = wipRoot;
}

