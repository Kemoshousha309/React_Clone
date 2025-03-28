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
export type FiberNode = {
  type: string | Function | null;
  dom: HTMLElement | Text | null;
  parent: FiberNode | null;
  child: FiberNode | null;
  sibling: FiberNode | null;
  props: {
    [key: string]: any;
    children: FiberNode[];
  };
};

