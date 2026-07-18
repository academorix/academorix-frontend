/**
 * @file vitest.config.ts
 * @module @stackra/decorators/test
 * @description Vitest configuration for @stackra/decorators.
 */

import { defineConfig, mergeConfig } from "vitest/config";
import path from "node:path";
import preset from "@stackra/testing/preset";

export default mergeConfig(
  preset,
  defineConfig({
    // Explicitly re-declare to survive mergeConfig — vitest 4's default OXC
    // transformer breaks decorator metadata emission.
    oxc: false,
    esbuild: false,
    test: {
      environment: "node",
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  }),
);
