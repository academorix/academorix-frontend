/**
 * @file packages/config/eslint/vite-app.mjs
 *
 * @description
 * Vite app preset — extends React + a11y and adds `react-refresh`
 * enforcement so Vite's Fast Refresh keeps working (components
 * must be the only export from a `.tsx` module).
 */

import reactRefreshPlugin from "eslint-plugin-react-refresh";

import reactConfig from "./react.mjs";

export default [
  ...reactConfig,

  {
    files: ["**/*.{jsx,tsx}"],
    plugins: {
      "react-refresh": reactRefreshPlugin,
    },
    rules: {
      // Vite HMR — components must be the only export of the module
      // for react-refresh to hot-swap correctly.
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
    },
  },
];
