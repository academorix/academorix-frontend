/**
 * @file vitest.config.ts
 * @module @stackra/vite/test
 * @description Vitest configuration for @stackra/vite — merges the shared
 *   `@stackra/testing/preset` (SWC transform with decorator metadata
 *   support) and pins the Node.js environment.
 */

import { defineConfig, mergeConfig } from "vitest/config";
import path from "node:path";
import preset from "@stackra/testing/preset";

export default mergeConfig(
  preset,
  defineConfig({
    // Explicitly re-declare to survive mergeConfig — Vitest 4's default OXC
    // transformer breaks decorator metadata emission, and SWC (owned by the
    // preset) is the sole transform in the pipeline.
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
