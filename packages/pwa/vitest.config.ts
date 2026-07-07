/**
 * @file vitest.config.ts
 * @module @academorix/pwa/vitest.config
 *
 * @description
 * Minimal Vitest config for @academorix/pwa. Runs `tsc`-checked tests
 * (co-located under `src/**\/__tests__/*.test.ts`) in the Node
 * environment. All helpers are pure — no globals, no side effects.
 */

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/__tests__/**/*.test.ts"],
    unstubGlobals: true,
    clearMocks: true,
  },
});
