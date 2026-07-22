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

  // Register the plugins at the config-array level (no `files` scope) so
  // downstream root/package configs can reference their rules without a
  // second `plugins: { "jsx-a11y": ... }` declaration — ESLint 9 flat
  // config rejects "Cannot redefine plugin" when two matching config
  // objects declare the same plugin key against overlapping files.
  {
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
      "jsx-a11y": jsxA11yPlugin,
    },
    settings: {
      react: { version: "detect" },
    },
  },

  {
    files: ["**/*.{jsx,tsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
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
