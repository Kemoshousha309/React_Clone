import { createElement, render } from './utils';
const React = {
  createElement
};
const element = /*#__PURE__*/React.createElement("h1", null, "Hello world");
const container = document.getElementById('app');
render(element, container);
