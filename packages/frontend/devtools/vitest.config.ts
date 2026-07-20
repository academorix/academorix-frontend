/**
 * @file vitest.config.ts
 * @module @stackra/devtools/test
 * @description Vitest configuration for `@stackra/devtools`.
 *
 *   Merges with `@stackra/testing/preset` for the SWC-backed
 *   transformer (which correctly emits `design:paramtypes` for DI
 *   classes referenced before their declaration).
 *
 *   Environment defaults to `jsdom` because the majority of tests
 *   exercise React components; pure-logic tests can opt out via a
 *   file-level `// @vitest-environment node` pragma.
 */

import { defineConfig, mergeConfig } from "vitest/config";
import path from "node:path";
import preset from "@stackra/testing/preset";

export default mergeConfig(
  preset,
  defineConfig({
    // Disable Vitest 4's default OXC + esbuild transformers so SWC is
    // the sole transform — matches every other workspace package.
    oxc: false,
    esbuild: false,
    test: {
      environment: "jsdom",
      setupFiles: ["./__tests__/vitest.setup.ts"],
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  }),
);
