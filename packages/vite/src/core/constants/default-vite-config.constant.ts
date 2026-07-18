/**
 * @file default-vite-config.constant.ts
 * @module @stackra/vite/core/constants
 * @description Minimal Vite defaults applied under every consumer's
 *   overrides by `defineConfig(...)`. Kept small on purpose —
 *   consumers own their build config.
 */

import type { UserConfig } from "vite";

// ════════════════════════════════════════════════════════════════════════════
// Constant
// ════════════════════════════════════════════════════════════════════════════

/**
 * Minimal Vite defaults applied under every consumer's overrides.
 *
 * Kept small on purpose — consumers own their build config. This
 * only sets things that would otherwise be surprising to omit:
 *
 * - `envPrefix: 'VITE_'` — Vite's own default, re-declared here so
 *   the merge is deterministic even if Vite's built-in default
 *   ever changes.
 * - `esbuild.tsconfigRaw.compilerOptions.experimentalDecorators` —
 *   matches the workspace's `tsconfig.base.json` so legacy TS
 *   decorators (`@Injectable()`, `@Inject()`) parse without extra
 *   configuration. `emitDecoratorMetadata` is intentionally NOT
 *   set here — esbuild's `TsconfigRaw` type does not declare it
 *   (esbuild has never implemented decorator-metadata emission),
 *   so consumers that rely on `design:paramtypes` for DI need to
 *   layer an SWC-based plugin (`@vitejs/plugin-react-swc` with
 *   `tsDecorators: true`, or `unplugin-swc`) into their plugin
 *   map. That plugin does emit metadata.
 *
 * Everything else — dev server host, build target, sourcemap
 * strategy, minifier — is left to the consumer. Consumers can
 * override any of these fields; `deepMerge(...)` gives them the win.
 *
 * @example
 * ```typescript
 * import { DEFAULT_VITE_CONFIG } from '@stackra/vite';
 *
 * // A user override for envPrefix wins:
 * defineConfig({ envPrefix: 'APP_' });
 * ```
 */
export const DEFAULT_VITE_CONFIG: UserConfig = {
  // Match Vite's own default so `import.meta.env.VITE_*` picks up
  // dotenv values without any extra configuration.
  envPrefix: "VITE_",
  esbuild: {
    // Enable legacy TS decorators so `@Injectable()` / `@Inject()`
    // parse in a stock esbuild pipeline. Metadata emission
    // (`design:paramtypes`) is not set here — esbuild does not
    // implement it. Layer `@vitejs/plugin-react-swc` (with
    // `tsDecorators: true`) or `unplugin-swc` into the plugin map
    // to get proper metadata for DI.
    tsconfigRaw: {
      compilerOptions: {
        experimentalDecorators: true,
      },
    },
  },
};
