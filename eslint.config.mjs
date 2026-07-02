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
  {
    // Ported pointer-driven components (pattern-lock, pin-lock, file-upload)
    // can't cleanly satisfy these; keep them visible as warnings.
    files: ["packages/ui/**/*.{ts,tsx}"],
    rules: {
      "jsx-a11y/click-events-have-key-events": "warn",
      "jsx-a11y/no-noninteractive-element-interactions": "warn",
      "jsx-a11y/no-static-element-interactions": "warn",
    },
  },
];
