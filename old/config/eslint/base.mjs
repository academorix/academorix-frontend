/**
 * @file packages/config/eslint/base.mjs
 *
 * @description
 * Base ESLint flat config for the monorepo. Every ESLint config in
 * the repo starts here and layers on framework-specific rules
 * (react.mjs for browser + JSX, vite-app.mjs for the Vite apps).
 *
 * ## Scope
 *
 * - `@eslint/js` recommended baseline
 * - `typescript-eslint` recommended-type-checked + stylistic-type-checked
 * - Import ordering enforced via `eslint-plugin-import`
 * - `eslint-plugin-unicorn` opinionated code-quality rules
 * - `eslint-config-prettier` at the tail — Prettier owns formatting;
 *   this config turns off every rule that would fight it.
 *
 * ## Not covered here
 *
 * - React / JSX rules — see `./react.mjs`
 * - Vite HMR / react-refresh — see `./vite-app.mjs`
 *
 * @see https://eslint.org/docs/latest/use/configure/configuration-files
 */

import js from "@eslint/js";
import importPlugin from "eslint-plugin-import";
import unicornPlugin from "eslint-plugin-unicorn";
import prettierConfig from "eslint-config-prettier";
import tseslint from "typescript-eslint";

export default tseslint.config(
  // Global ignores — Prettier owns formatting, Turborepo owns caches.
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/out/**",
      "**/.next/**",
      "**/.turbo/**",
      "**/coverage/**",
      "**/*.d.ts",
      "**/storybook-static/**",
      "**/playwright-report/**",
      "**/test-results/**",
    ],
  },

  // Base JS + TS recommended.
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  // TS parser + shared rules.
  {
    files: ["**/*.{ts,tsx,mts,cts}"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: process.cwd(),
      },
    },
    plugins: {
      import: importPlugin,
      unicorn: unicornPlugin,
    },
    rules: {
      // Import ordering — enforced across the monorepo.
      "import/order": [
        "error",
        {
          groups: ["builtin", "external", "internal", "parent", "sibling", "index", "type"],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],

      // Filename convention: kebab-case for files, PascalCase allowed
      // for React components + type-defining modules.
      "unicorn/filename-case": ["error", { cases: { kebabCase: true, pascalCase: true } }],

      // React treats `null` as an intentional render sentinel.
      "unicorn/no-null": "off",

      // Prevents `xhr` / `err` abbreviations but noisy on legitimate
      // shorthand like `props`, `params`, `db`. Off by default.
      "unicorn/prevent-abbreviations": "off",

      // No implicit `any`. Fixable to `unknown` on request.
      "@typescript-eslint/no-explicit-any": [
        "error",
        { fixToUnknown: false, ignoreRestArgs: true },
      ],

      // Inline type imports keep runtime bundles slimmer.
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],

      // `console.log` is a bug; `console.warn` / `console.error` are
      // OK because Sentry captures them.
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },

  // JS files — no type-aware rules.
  {
    files: ["**/*.{js,mjs,cjs}"],
    ...tseslint.configs.disableTypeChecked,
  },

  // Test file relaxations — pragmatism > purity in tests.
  {
    files: ["**/*.test.{ts,tsx,js,jsx}", "**/__tests__/**", "**/tests/**", "**/e2e/**"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
    },
  },

  // Prettier — MUST be last. Turns off any rule that would fight
  // Prettier's formatting decisions.
  prettierConfig,
);
