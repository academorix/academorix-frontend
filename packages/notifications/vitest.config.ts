/**
 * @file vitest.config.ts
 * @module @academorix/notifications/vitest.config
 *
 * @description
 * Vitest config for the `@academorix/notifications` package.
 *
 * The workspace has no shared vitest preset today — each package
 * ships its own config. This one turns on:
 *
 *  - jsdom for the React context tests + `atob`/`btoa` + `window` /
 *    `navigator` helpers used by the push utilities.
 *  - Explicit imports (`globals: false`) — every test imports
 *    `describe` / `it` / `expect` from `vitest` directly, matching
 *    the workspace lint config (no ambient globals).
 *  - `@testing-library/jest-dom` matchers wired into the test setup.
 *  - v8 coverage — reports both `text` (CI log) and `html` (dev).
 *
 * Vitest 4 uses oxc as the transformer by default; oxc reads
 * `jsx: "react-jsx"` from `tsconfig.json` so `.tsx` sources compile
 * with the React 19 automatic runtime — no plugin required.
 */

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: false,
    setupFiles: ["./src/__tests__/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      reportsDirectory: "./coverage",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.test.{ts,tsx}", "src/__tests__/**", "src/**/index.ts"],
    },
  },
});
