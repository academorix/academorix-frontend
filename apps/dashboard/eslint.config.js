/**
 * @file apps/dashboard/eslint.config.js
 *
 * @description
 * Dashboard-specific ESLint config. Extends the shared
 * `@academorix/config-eslint/vite-app` preset (base + react +
 * react-refresh) and adds only app-specific overrides.
 */

import viteApp from "@academorix/config-eslint/vite-app";

export default [
  ...viteApp,
  {
    ignores: ["dist", "playwright-report", "test-results", "plugins/**/*.js"],
  },
];
