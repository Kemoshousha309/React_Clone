// filepath: d:\demos\React_Clone\vite.config.js
import { defineConfig } from 'vite';
import babel from 'vite-plugin-babel';

export default defineConfig({
  plugins: [
    babel({
      babelConfig: {
        presets: ['@babel/preset-react'], // Use your Babel preset for JSX
      },
    }),
  ],
});