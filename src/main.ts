
// =======================
// SIMPLE APP EXAMPLE
// =======================

import { render, useState } from "./React";
import { createElement } from "./React/utils";

// A simple counter component using our useState hook
function Counter() {
  const [count, setCount] = useState(0); 
  return createElement( 
    "div",
    { style: "font-family: sans-serif; padding: 10px;" },
    createElement("h1", {}, "Counter: ", count),
    createElement(
      "button",
      {
        onClick: () => setCount((prev: number) => prev + 1),
        style: "padding: 8px 16px; font-size: 16px;",
      },
      "Increment"
    )
  );
}

// The main App component
function App() {
  return createElement(
    "div",
    {},
    createElement("h2", {} , "My Simple React Fiber"),
    createElement(Counter, {value: 5})
  );
}

// =======================
// Kick off the App
// =======================

const container = document.getElementById("root");
if (container) {
  render(createElement(App, {}), container);
}

