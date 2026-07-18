/**
 * @file vitest.config.ts
 * @module @academorix/analytics/vitest.config
 *
 * @description
 * Vitest configuration for `@academorix/analytics`. The provider is a
 * React component so jsdom is required; `globals: true` mirrors the
 * workspace convention so `@testing-library/react`'s auto-cleanup
 * finds the `afterEach` hook.
 */

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
});
