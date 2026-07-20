/**
 * @file vitest.config.ts
 * @module @stackra/scope/test
 * @description Vitest configuration for @stackra/scope.
 */

import { defineConfig, mergeConfig } from "vitest/config";
import path from "node:path";
import preset from "@stackra/testing/preset";

export default mergeConfig(
  preset,
  defineConfig({
    oxc: false,
    esbuild: false,
    test: {
      environment: "node",
      setupFiles: ["./__tests__/vitest.setup.ts"],
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  }),
);
