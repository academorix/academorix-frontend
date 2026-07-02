/**
 * @see https://prettier.io/docs/configuration
 * @type {import("prettier").Config}
 */
export default {
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
  plugins: ["prettier-plugin-tailwindcss"],
  // Tailwind v4 resolves its theme from the CSS entrypoint (not a JS config).
  tailwindStylesheet: "./apps/web/src/styles/globals.css",
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
