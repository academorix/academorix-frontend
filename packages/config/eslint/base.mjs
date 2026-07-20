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
      // Per-package build/test config files — not in tsconfig include
      // (which restricts tsc to `src/**`), so type-aware linting can't
      // parse them. Prettier owns their formatting; ESLint is skipped.
      "**/tsup.config.ts",
      "**/tsup.config.js",
      "**/tsup.config.mjs",
      "**/vitest.config.ts",
      "**/vitest.config.mts",
      "**/vitest.config.js",
      "**/vite.config.ts",
      "**/vite.config.mts",
      "**/vite.config.js",
      "**/playwright.config.ts",
      "**/rollup.config.ts",
      "**/rollup.config.js",
      "**/webpack.config.ts",
      "**/webpack.config.js",
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

      // Honour the `_` prefix convention for intentionally-unused
      // params + destructured names — TS/JS idiomatic marker that
      // "this parameter exists to match a signature but the body
      // doesn't need it". Also allow unused caught error bindings
      // (many `catch { … }` blocks are fail-soft).
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          args: "after-used",
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrors: "all",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],
      // The plain-JS rule needs the same treatment or it double-flags.
      "no-unused-vars": "off",
    },
  },

  // JS files — no type-aware rules.
  {
    files: ["**/*.{js,mjs,cjs}"],
    ...tseslint.configs.disableTypeChecked,
  },

  // Test file relaxations — pragmatism > purity in tests. Tests
  // legitimately mock things and cast values; forcing type-safe patterns
  // through fixtures makes fixtures more complex than the code they test.
  //
  // ALSO: test files are typically not in a package's tsconfig `include`
  // (which restricts tsc to `src/**`), so type-aware linting via
  // `projectService: true` can't parse them at all. We disable both
  // `projectService` AND every type-aware rule for these files —
  // syntactic parsing is enough for the rules that remain.
  {
    files: [
      "**/*.test.{ts,tsx,js,jsx}",
      "**/*.spec.{ts,tsx,js,jsx}",
      "**/__tests__/**",
      "**/tests/**",
      "**/e2e/**",
      // src/testing/** ships published test helpers — same relaxations
      // as consumer test suites apply (fixtures, mock builders, and
      // `unknown` cast points at the API boundary).
      "**/src/testing/**",
    ],
    languageOptions: {
      parserOptions: {
        // Turn off projectService so tseslint doesn't try to look up
        // these files in the tsconfig program.
        projectService: false,
        project: null,
      },
    },
    // `disableTypeChecked` disables every rule that requires parser
    // services (await-thenable, no-unsafe-*, require-await, …).
    ...tseslint.configs.disableTypeChecked,
    rules: {
      // Merge with disableTypeChecked's rule bag (spread ...disableTypeChecked
      // above already turns off type-aware rules; these are the additional
      // non-type-aware relaxations for tests).
      ...tseslint.configs.disableTypeChecked.rules,
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-this-alias": "off",
      "no-console": "off",
      "no-empty": "off",
    },
  },

  // Prettier — MUST be last. Turns off any rule that would fight
  // Prettier's formatting decisions.
  prettierConfig,
);
