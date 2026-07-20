/**
 * @file vitest.config.ts
 * @module @stackra/ui/test
 * @description Vitest configuration for @stackra/ui. Individual spec files
 *   opt into jsdom via `// @vitest-environment jsdom` at the top; the
 *   default environment stays `node` for parity with the rest of the
 *   monorepo. The `setupFiles` entry loads the shared
 *   `@stackra/testing/setup` afterEach and stubs the small HeroUI Pro
 *   `matchMedia` dependency that jsdom does not provide.
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
      setupFiles: ["./__tests__/vitest.setup.ts"],
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  }),
);
