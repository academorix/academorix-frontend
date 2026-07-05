/** @type {import("lint-staged").Configuration} */
export default {
  "*.{ts,tsx,js,jsx,cjs,mjs}": ["eslint --fix", "prettier --write"],
  "*.{json,md,css,yaml,yml}": ["prettier --write"],
  // Any change under the mock-data directory must pass the full validator.
  // We don't filter to just the changed files because FK integrity is global.
  "apps/web/public/data/**/*.{json,md}": () => "pnpm --filter @academorix/dashboard mock:validate",
  "apps/web/scripts/validate-mock-data.mjs": () =>
    "pnpm --filter @academorix/dashboard mock:validate",
};
