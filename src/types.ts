export interface ElementNode {
  type: keyof HTMLElementTagNameMap,
  props: {
    [key: string]: (string | ElementNode | TextNode)[],
    children: (ElementNode | TextNode)[]
  },
}

export interface TextNode {
  type: "TEXT_ELEMENT",
  props: {
    [key: string]: string,
    nodeValue: string
  },
}