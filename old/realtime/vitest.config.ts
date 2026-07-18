/**
 * @file vitest.config.ts
 * @module @academorix/realtime/vitest.config
 *
 * @description
 * Vitest configuration for `@academorix/realtime`. jsdom is required
 * because the hooks + provider are React runtime code and the client
 * factory guards SSR via `typeof window === "undefined"` — we need a
 * real `window` in the default test environment to exercise the
 * primary code path.
 *
 * `globals: true` matches the workspace convention so
 * `@testing-library/react`'s auto-cleanup finds the `afterEach` hook.
 */

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
});
