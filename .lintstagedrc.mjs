/**
 * @file .lintstagedrc.mjs
 * @description
 * lint-staged config — runs eslint + prettier over staged files during
 * pre-commit. `--max-warnings=0` makes ESLint fail on any warning;
 * `--ignore-unknown` lets prettier skip files it can't format instead of
 * erroring on the whole hook run.
 *
 * @type {import("lint-staged").Configuration}
 */
export default {
  "*.{ts,tsx,js,jsx,cjs,mjs}": [
    "eslint --fix --max-warnings=0",
    "prettier --write --ignore-unknown",
  ],
  "*.{json,jsonc,md,mdx,css,yaml,yml,html}": ["prettier --write --ignore-unknown"],
};
