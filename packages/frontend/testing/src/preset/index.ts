/**
 * @file index.ts
 * @module @stackra/testing/preset
 * @description Shared Vitest configuration preset for the monorepo.
 *
 *   TypeScript is transformed via `unplugin-swc` because Vitest 4's
 *   default transformer (OXC) does not emit `design:paramtypes` for
 *   forward-referenced classes — it outputs `[undefined]` and the DI
 *   container silently fails to inject constructor deps. SWC with
 *   `emitDecoratorMetadata: true` handles this correctly.
 *
 *   The top-level `oxc: false` disables Vitest 4's default TS
 *   transformer so SWC is the sole transform in the pipeline.
 */

import { defineConfig } from "vitest/config";
import path from "node:path";
import swc from "unplugin-swc";

export default defineConfig({
  plugins: [
    swc.vite({
      module: { type: "es6" },
      jsc: {
        target: "es2022",
        parser: {
          syntax: "typescript",
          // Enable TSX parsing so React test files (`.spec.tsx`,
          // `.test.tsx`) compile through the same SWC transform as
          // regular TS. React tests use per-file
          // `// @vitest-environment jsdom` to opt into jsdom.
          tsx: true,
          decorators: true,
        },
        transform: {
          legacyDecorator: true,
          decoratorMetadata: true,
          react: {
            // Modern automatic JSX transform — matches React 19's
            // `jsx: 'react-jsx'` compiler option. No manual React
            // import needed in tests.
            runtime: "automatic",
          },
        },
        keepClassNames: true,
      },
    }),
  ],
  // Vitest 4 uses OXC as the default TS transformer. It does NOT emit
  // reliable `design:paramtypes` for classes referenced before their
  // declaration (a common pattern in DI tests). Disable it entirely so
  // SWC — which handles this correctly — is the sole transform.
  oxc: false,
  esbuild: false,
  test: {
    globals: true,
    environment: "node",
    // Include TSX-suffixed React tests alongside the TS defaults.
    // Individual test files opt into jsdom via
    // `// @vitest-environment jsdom` at the top of the file.
    include: [
      "__tests__/**/*.test.ts",
      "__tests__/**/*.spec.ts",
      "__tests__/**/*.test.tsx",
      "__tests__/**/*.spec.tsx",
    ],
    exclude: ["node_modules", "dist"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.ts", "src/**/*.tsx"],
      exclude: ["src/**/index.ts", "src/**/*.interface.ts", "src/**/*.type.ts", "src/**/*.d.ts"],
    },
    passWithNoTests: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "./src"),
    },
  },
});
