/**
 * @file vitest.config.ts
 * @module @stackra/dashboard/test
 * @description Vitest configuration for @stackra/dashboard.
 */

import path from "node:path";

import preset from "@stackra/testing/preset";
import { defineConfig, mergeConfig } from "vitest/config";

export default mergeConfig(
  preset,
  defineConfig({
    // Explicitly re-declare to survive mergeConfig — vitest 4's default OXC
    // transformer breaks decorator metadata emission.
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
