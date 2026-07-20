/**
 * @file packages/config/eslint/react.mjs
 *
 * @description
 * React + JSX + a11y ruleset. Extends the base config. Apply this
 * to any package or app that renders React components.
 *
 * Adds:
 * - `eslint-plugin-react` recommended
 * - `eslint-plugin-react-hooks` recommended
 * - `eslint-plugin-jsx-a11y` recommended
 */

import jsxA11yPlugin from "eslint-plugin-jsx-a11y";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import globals from "globals";

import baseConfig from "./base.mjs";

export default [
  ...baseConfig,

  {
    files: ["**/*.{jsx,tsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
      "jsx-a11y": jsxA11yPlugin,
    },
    settings: {
      react: { version: "detect" },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      ...jsxA11yPlugin.configs.recommended.rules,

      // Not needed with modern JSX runtime (React 17+).
      "react/react-in-jsx-scope": "off",

      // TypeScript handles prop types; the ESLint check is
      // redundant + slow on large components.
      "react/prop-types": "off",
    },
  },
];
