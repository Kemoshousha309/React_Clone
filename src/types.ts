export interface ElementNode {
  type: keyof HTMLElementTagNameMap;
  props: {
    [key: string]: (string | ElementNode | TextNode)[];
    children: (ElementNode | TextNode)[];
  };
}

export interface TextNode {
  type: 'TEXT_ELEMENT';
  props: {
    [key: string]: string;
    nodeValue: string;
  };
}
export interface FiberNode {
  type: string | null;
  props: any;
  dom: HTMLElement | Text | null;
  parent: FiberNode | null;
  child: FiberNode | null;
  sibling: FiberNode | null;
  alternate: FiberNode | null; // Previous fiber node for diffing
  effectTag?: "PLACEMENT" | "UPDATE" | "DELETION"; // Marks what to do with the node
  nextEffect?: FiberNode | null; // Tracks fibers that need updates
}


