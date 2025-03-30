
// =======================
// Type Definitions
// =======================

export type FiberNodeType = string | Function;

export interface FiberNode {
  type: FiberNodeType | null;
  props: any;
  dom: HTMLElement | Text | null;
  parent: FiberNode | null;
  child: FiberNode | null;
  sibling: FiberNode | null;
  alternate: FiberNode | null; // Old fiber for reconciliation
  memoizedState?: Hook[];      // For hooks (useState, etc.)
  effectTag?: "PLACEMENT" | "UPDATE" | "DELETION"; // Marks the work to do in commit phase
}

export interface Hook {
  state: any;
  queue: ((prevState: any) => any)[];
}
