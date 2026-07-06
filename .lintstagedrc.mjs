/** @type {import("lint-staged").Configuration} */
export default {
  "*.{ts,tsx,js,jsx,cjs,mjs}": ["eslint --fix", "prettier --write"],
  "*.{json,md,css,yaml,yml}": ["prettier --write"],
};
