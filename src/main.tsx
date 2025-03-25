import { createElement, render } from './utils';

const React = {createElement}
const element = <h1>Hello world</h1>;
const container = document.getElementById('app');

render(element, container);
  