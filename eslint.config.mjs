import react from "@stackra/config-eslint/react";

/**
 * Root ESLint config. Used when linting from the repo root (e.g. lint-staged).
 * Each workspace also has its own config for isolated `turbo run lint`.
 *
 * The `@stackra/config-eslint/react` preset registers `jsx-a11y` (and the
 * react + react-hooks plugins) in an unscoped config object at the head of
 * its array — meaning downstream configs here can reference `jsx-a11y/*`
 * rules without redeclaring the plugin.
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
    files: ["packages/frontend/ui/**/*.{ts,tsx}"],
    rules: {
      "jsx-a11y/click-events-have-key-events": "warn",
      "jsx-a11y/no-noninteractive-element-interactions": "warn",
      "jsx-a11y/no-static-element-interactions": "warn",
    },
  },
];
