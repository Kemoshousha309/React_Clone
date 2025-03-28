import { createElement } from './fiber_render';
import { render } from './miniReact';

// const React = { createElement };

// function Goodbye() {
//   return <h1>Goodby Bro</h1>
// }
// function App() {
//   return (
//     <div>
//       <h1>Hello world</h1>
//       <h2>It is {new Date().toLocaleTimeString()}.</h2>
//       {Goodbye()}
//     </div>
//   );
// }

const App = createElement(
  "div",
  {},
  createElement("h1", {}, "Hello, Fiber!"),
  createElement("p", {}, "This is a simple React Fiber.")
);


const container = document.getElementById('app') as HTMLElement;

// debugger;
render(App, container);
