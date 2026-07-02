/**
 * @see https://prettier.io/docs/configuration
 * @type {import("prettier").Config}
 */
export default {
  semi: true,
  singleQuote: false,
  trailingComma: "all",
  printWidth: 80,
  tabWidth: 2,
  endOfLine: "lf",
  plugins: ["prettier-plugin-tailwindcss"],
  // Tailwind v4 resolves its theme from the CSS entrypoint (not a JS config).
  tailwindStylesheet: "./apps/web/src/styles/globals.css",
};
