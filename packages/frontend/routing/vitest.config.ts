/**
 * @file vitest.config.ts
 * @module @stackra/routing/test
 * @description Vitest configuration for @stackra/routing.
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
        // The `./testing` subpath's helpers (`renderWithRouting`,
        // `<RoutingTestFrame>`) intentionally reach for
        // `StackraRoutingContext` via the PUBLIC subpath
        // `@stackra/routing/react` — see the tsup config note. When
        // running the package's own Vitest suite, that same specifier
        // must resolve to the SOURCE of the react subpath (not the
        // `dist/react.mjs` output the exports map points at) so it
        // matches the identity of the context used by the source
        // hooks under test. Two source files = two `createContext`
        // calls otherwise.
        "@stackra/routing/react": path.resolve(__dirname, "./src/react/index.ts"),
      },
    },
  }),
);
