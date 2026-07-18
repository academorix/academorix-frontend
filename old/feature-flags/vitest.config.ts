/**
 * @file vitest.config.ts
 * @module @academorix/feature-flags/vitest.config
 *
 * @description
 * Vitest configuration for `@academorix/feature-flags`. jsdom is
 * required because `FeatureFlagsProvider` is a React component;
 * `globals: true` matches the workspace convention so
 * `@testing-library/react`'s auto-cleanup finds the `afterEach`
 * hook.
 */

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
});
