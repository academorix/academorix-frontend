/**
 * @file apps/landing-page/eslint.config.js
 *
 * @description
 * Landing-page ESLint config. Extends the shared preset — no
 * app-specific overrides needed yet.
 */

import viteApp from "@academorix/config-eslint/vite-app";

export default [
  ...viteApp,
  {
    ignores: ["dist", "playwright-report", "test-results", "plugins/**/*.js"],
  },
];
