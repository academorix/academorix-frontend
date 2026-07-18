/**
 * @file vitest.config.ts
 * @module @academorix/query/vitest.config
 *
 * @description
 * Vitest configuration for `@academorix/query`. Runs the co-located
 * `__tests__/*` files with the following environment split:
 *
 *  - **jsdom** — the whole suite runs under jsdom because
 *    `defineResource` exercises React Query hooks with
 *    `@testing-library/react`. Non-React modules (`serializeLaravelQuery`,
 *    `serializeListParams`, `buildQueryKey`, `createRefineRestDataProvider`)
 *    happily execute under jsdom too — the environment is a superset
 *    of Node's globals plus a DOM.
 *  - **globals: false** — tests use explicit `describe` / `it` /
 *    `expect` / `vi` imports to stay grep-able.
 *  - **unstubGlobals + clearMocks** — after every test, any
 *    `vi.stubGlobal` / mock function is reset so cases don't leak
 *    into each other.
 */

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: false,
    include: ["src/**/__tests__/**/*.test.{ts,tsx}"],
    unstubGlobals: true,
    clearMocks: true,
  },
});
