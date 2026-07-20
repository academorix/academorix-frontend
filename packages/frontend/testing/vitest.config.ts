/**
 * @file vitest.config.ts
 * @module @stackra/testing
 * @description Package has no runnable tests — the `test` script echoes a
 *   no-op message. This config exists only so `vitest --run` inside this
 *   directory doesn't error out if invoked directly.
 */

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: [],
    passWithNoTests: true,
  },
});
