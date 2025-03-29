import { FiberNode } from "./types";

export function createDom(fiber: FiberNode): HTMLElement | Text {
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