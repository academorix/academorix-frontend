/**
 * @file index.mjs
 * @module @stackra/config-prettier
 *
 * @description
 * Canonical Prettier configuration for the stackra-frontend monorepo.
 * Every root and per-package prettier.config.mjs re-exports this default.
 *
 * @see https://prettier.io/docs/configuration
 * @type {import("prettier").Config}
 */
export default {
  // ── Core style ─────────────────────────────────────────────────────
  semi: true,
  singleQuote: false,
  trailingComma: "all",
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  arrowParens: "always",
  endOfLine: "lf",
  bracketSpacing: true,
  bracketSameLine: false,

  // ── Plugins ────────────────────────────────────────────────────────
  //
  // `prettier-plugin-tailwindcss` handles utility-class sorting.
  //
  // We intentionally OMIT `tailwindStylesheet` here. Setting it to a
  // workspace-scoped path (e.g. `@stackra/ui`'s `globals.css`) makes
  // the plugin try to resolve the stylesheet's own `@import "@heroui/..."`
  // directives from the config-package's directory, which fails because
  // the plugin ships with prettier and doesn't traverse workspace deps.
  //
  // Class sorting still works without a stylesheet — it just falls back
  // to Tailwind's default class order rather than theme-aware order.
  // Consumers that need theme-aware sorting compose their own local
  // `prettier.config.mjs` that spreads this default and adds their
  // relative `tailwindStylesheet` path.
  plugins: ["prettier-plugin-tailwindcss"],

  // ── Per-filetype overrides ────────────────────────────────────────
  overrides: [
    {
      files: ["*.json", "*.jsonc"],
      options: { trailingComma: "none" },
    },
    {
      files: ["*.md"],
      options: { proseWrap: "always", printWidth: 80 },
    },
  ],
};
