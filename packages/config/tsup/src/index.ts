/**
 * @file index.ts
 * @module @academorix/config-tsup
 *
 * @description
 * Shared tsup config helper for every workspace package.
 *
 * Each package's local `tsup.config.ts` calls `defineBaseConfig(entries, {...})`.
 * The base config auto-externalises anything in `dependencies` and
 * `peerDependencies`; anything imported optionally at runtime (lazy `require`
 * / `await import`) must be listed in the `external` override.
 *
 * ## Example
 * ```ts
 * import { defineBaseConfig } from "@academorix/config-tsup";
 *
 * export default defineBaseConfig({
 *   index: "src/index.ts",
 *   react: "src/react/index.ts",
 * });
 * ```
 */

import { defineConfig, type Options } from "tsup";

/** Map of entry names to source paths. */
export type Entries = Record<string, string>;

/**
 * Build a tsup config with the workspace's canonical defaults.
 *
 * @param entry - Entry map (e.g. `{ index: "src/index.ts" }`).
 * @param overrides - Any tsup Options to merge on top.
 * @returns tsup config compatible with `export default`.
 */
export function defineBaseConfig(entry: Entries, overrides: Partial<Options> = {}) {
  // Capture any package-level esbuild/swc overrides so we can compose
  // instead of clobbering.
  const userEsbuildOptions = overrides.esbuildOptions;
  const userSwc = overrides.swc;

  return defineConfig({
    entry,
    format: ["cjs", "esm"],
    dts: true,
    sourcemap: true,
    clean: true,
    splitting: false,
    treeshake: true,
    target: "es2022",
    tsconfig: "./tsconfig.json",
    // Preserve class names — the DI container uses `Class.name` as
    // provider identity.
    keepNames: true,
    ...overrides,
    // ── JSX automatic runtime ────────────────────────────────────────────
    //
    // Every React-shipping package MUST emit the automatic JSX runtime
    // (`import { jsx as _jsx } from 'react/jsx-runtime'`) so authors do
    // not need `import * as React from 'react'` just to satisfy a
    // classic `React.createElement(...)` transform.
    //
    // Two layers pipeline JSX in this repo — both need to know:
    //
    // 1. **swc** (via `unplugin-swc` / `@swc/core`) runs FIRST when
    //    `emitDecoratorMetadata` is on (which the shared base tsconfig
    //    enables for NestJS-compatible DI). swc rewrites JSX BEFORE
    //    esbuild sees the code and defaults to the classic runtime —
    //    so we must set `swc.jsc.transform.react.runtime = 'automatic'`
    //    or the JSX comes out as `React.createElement(...)` with no
    //    `React` symbol imported, causing a runtime `ReferenceError:
    //    React is not defined`.
    //
    // 2. **esbuild** runs after swc for the final bundle. Setting
    //    `options.jsx = 'automatic'` is redundant for packages that
    //    go through swc, but keeps the setting correct for any file
    //    that ever bypasses swc.
    //
    // The base tsconfig already declares `"jsx": "react-jsx"`, but
    // neither swc (with `swcrc: false`) nor esbuild traverses the
    // tsconfig `extends` chain for the JSX field, so the intent has
    // to be repeated here.
    //
    // We cast the swc object because tsup's `SwcPluginConfig` types
    // `logger` as required, and TypeScript can't infer that a partial
    // spread will get filled by tsup's own defaults at build time.
    swc: {
      ...userSwc,
      jsc: {
        ...userSwc?.jsc,
        transform: {
          ...userSwc?.jsc?.transform,
          react: {
            ...userSwc?.jsc?.transform?.react,
            runtime: "automatic",
          },
        },
      },
    } as Options["swc"],
    esbuildOptions(options, context) {
      options.jsx = "automatic";
      if (userEsbuildOptions) userEsbuildOptions(options, context);
    },
  });
}
