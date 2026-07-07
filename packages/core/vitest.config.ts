/**
 * @file vitest.config.ts
 * @module @academorix/core/vitest.config
 *
 * @description
 * Minimal Vitest config for @academorix/core. Runs `tsc`-checked tests
 * (co-located under `src/**\/__tests__/*.test.ts`) in the Node
 * environment. Cross-runtime probing tests rely on `vi.stubGlobal`, so
 * globals reset automatically after each test via `unstubGlobals`.
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
