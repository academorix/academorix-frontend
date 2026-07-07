/**
 * @file vitest.config.ts
 * @module @academorix/i18n/vitest.config
 *
 * @description
 * Vitest configuration for `@academorix/i18n`. The `<LocaleProvider>`
 * touches `<html lang>` / `<html dir>` and `window.localStorage`, so
 * we need a DOM-shaped environment — `jsdom` provides it. `globals: true`
 * mirrors the workspace convention so `beforeEach` / `afterEach` are
 * available to `@testing-library/react`'s auto-cleanup.
 */

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    // Pin the timezone so date/relative-time formatters give the same
    // output on every developer's machine + CI. Otherwise a Mac in
    // Cupertino formats `new Date("2026-07-06")` as "Jul 5, 2026".
    env: {
      TZ: "UTC",
    },
  },
});
