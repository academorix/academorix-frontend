/**
 * @file vitest.config.ts
 * @module @academorix/http/vitest.config
 *
 * @description
 * Vitest configuration for `@academorix/http`. Runs in the `jsdom`
 * environment because several suites touch `document`,
 * `window.localStorage`, `window.sessionStorage`, and `navigator`
 * (token persistence, device fingerprint, locale reader). Tests live
 * next to source in `src/**\/__tests__/*.test.ts`.
 */

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: false,
    include: ["src/**/__tests__/**/*.test.ts"],
    restoreMocks: true,
    unstubGlobals: true,
    unstubEnvs: true,
  },
});
