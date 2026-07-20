/**
 * @file packages/config/eslint/native.mjs
 *
 * @description
 * React Native ruleset — a standalone preset (does NOT extend the
 * base) because the base enables type-aware TS rules
 * (`recommendedTypeChecked` + `stylisticTypeChecked`) that require
 * `parserOptions.projectService: true`. RN template projects ship a
 * minimal tsconfig without projectService, so those rules crash.
 *
 * Layers:
 * - `@eslint/js` recommended (non-type-aware).
 * - `typescript-eslint` recommended (non-type-aware).
 * - `eslint-plugin-react` + `react-hooks` recommended.
 * - `eslint-plugin-unicorn` — filename-case only (RN uses PascalCase
 *   for App.tsx, App.test.tsx).
 * - `eslint-config-prettier` at the tail — Prettier owns formatting.
 */

import js from "@eslint/js";
import prettierConfig from "eslint-config-prettier";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import unicornPlugin from "eslint-plugin-unicorn";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  // Global ignores.
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/coverage/**",
      "**/.turbo/**",
      "**/ios/**",
      "**/android/**",
      "**/*.d.ts",
    ],
  },

  // Base JS + TS recommended (non-type-aware — safe without projectService).
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Source files — React Native runtime globals + React + hooks.
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.node,
        __DEV__: "readonly",
        __METRO_GLOBAL_PREFIX__: "readonly",
        HermesInternal: "readonly",
        fetch: "readonly",
        Request: "readonly",
        Response: "readonly",
        Headers: "readonly",
        FormData: "readonly",
        URL: "readonly",
        URLSearchParams: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        requestAnimationFrame: "readonly",
        cancelAnimationFrame: "readonly",
        // Jest globals — the RN template ships __tests__/App.test.tsx.
        describe: "readonly",
        it: "readonly",
        test: "readonly",
        expect: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        jest: "readonly",
      },
    },
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
      unicorn: unicornPlugin,
    },
    settings: {
      react: { version: "detect" },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,

      // Modern JSX runtime — no React-in-scope requirement.
      "react/react-in-jsx-scope": "off",

      // TypeScript handles prop types.
      "react/prop-types": "off",

      // Filename case — App.tsx, App.test.tsx are RN convention.
      "unicorn/filename-case": ["error", { cases: { kebabCase: true, pascalCase: true } }],

      // `console.log` is a bug; `console.warn` / `console.error` are OK.
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },

  // RN toolchain config files (CJS) — `require()` is idiomatic here.
  {
    files: [
      "metro.config.js",
      "babel.config.js",
      "jest.config.js",
      "react-native.config.js",
      "**/*.config.js",
    ],
    languageOptions: {
      sourceType: "commonjs",
      globals: { ...globals.node },
    },
    rules: {
      "@typescript-eslint/no-var-requires": "off",
      "@typescript-eslint/no-require-imports": "off",
      "no-undef": "off",
    },
  },

  // Prettier — MUST be last.
  prettierConfig,
);
