import react from "@academorix/eslint-config/react";

/**
 * Root ESLint config. Used when linting from the repo root (e.g. lint-staged).
 * Each workspace also has its own config for isolated `turbo run lint`.
 */
export default [
  {
    ignores: [
      "**/dist/**",
      "**/coverage/**",
      "**/node_modules/**",
      "**/.turbo/**",
      "**/.vercel/**",
    ],
  },
  ...react,
];
