/**
 * @file define-config.util.ts
 * @module @stackra/vite/core/utils
 * @description Primary entry point for `@stackra/vite`. Returns a
 *   Vite-compatible config factory that resolves the plugin-map
 *   envelope and merges the workspace defaults under the caller's
 *   overrides.
 */

import type { ConfigEnv, UserConfig } from "vite";
import type { IViteConfigOptions } from "../interfaces/vite-config-options.interface";
import { DEFAULT_VITE_CONFIG } from "../constants/default-vite-config.constant";
import { deepMerge } from "./deep-merge.util";
import { resolvePlugins } from "./resolve-plugins.util";

// ════════════════════════════════════════════════════════════════════════════
// Public API
// ════════════════════════════════════════════════════════════════════════════

/**
 * Create a Vite configuration with `@stackra/vite`'s plugin-map
 * envelope semantics.
 *
 * Returns a Vite config factory `(env: ConfigEnv) => Promise<UserConfig>`
 * — the same shape Vite's own `defineConfig(...)` accepts. The
 * factory:
 *
 * 1. Resolves the plugin map into a `Plugin[]` array via
 *    {@link resolvePlugins} (each enabled entry's factory is
 *    invoked with its options; disabled entries are skipped).
 * 2. Deep-merges {@link DEFAULT_VITE_CONFIG} under the caller's
 *    overrides — the caller's values always win on conflict.
 * 3. Attaches the resolved plugin array to the merged config.
 *
 * The factory accepts the standard Vite `ConfigEnv` argument
 * (`{ mode, command, ... }`) even though v0 does not use it — the
 * signature matches Vite's contract and gives us a future-proof
 * surface for mode-aware overrides.
 *
 * @param options - The plugin map + any additional Vite
 *   `UserConfig` overrides. Optional — defaults to `{}`.
 * @returns A Vite config factory. Feed it as the default export of
 *   your `vite.config.ts`.
 *
 * @example
 * ```typescript
 * import react from '@vitejs/plugin-react-swc';
 * import { defineConfig } from '@stackra/vite';
 *
 * export default defineConfig({
 *   plugins: {
 *     react: { enabled: true, factory: react, options: { tsDecorators: true } },
 *   },
 *   server: { port: 3000 },
 * });
 * ```
 */
export function defineConfig(
  options: IViteConfigOptions = {},
): (env: ConfigEnv) => Promise<UserConfig> {
  // Return a Vite config factory. `_env` is accepted for signature
  // compatibility with Vite's `UserConfigFn` type; v0 does not
  // consume it, but retaining the parameter keeps future mode-aware
  // logic a non-breaking addition.
  return async (_env: ConfigEnv): Promise<UserConfig> => {
    // 1. Resolve the plugin map into `Plugin[]`. Disabled entries
    //    are skipped inside `resolvePlugins`, so a `false` toggle
    //    has zero factory cost.
    const plugins = await resolvePlugins(options.plugins);

    // 2. Strip the `plugins` key from the overrides so `deepMerge`
    //    only sees the `UserConfig`-compatible slice. The `_plugins`
    //    binding is intentionally discarded — the underscore prefix
    //    signals "unused" to the linter + `noUnusedLocals`.
    const { plugins: _plugins, ...overrides } = options;
    void _plugins;

    // 3. Deep-merge `DEFAULT_VITE_CONFIG` under the caller's
    //    overrides. The caller wins on conflict; the defaults only
    //    fill fields the caller left unset.
    const merged = deepMerge<UserConfig>(DEFAULT_VITE_CONFIG, overrides as Partial<UserConfig>);

    // 4. Attach the resolved plugin array. This is a fresh
    //    assignment (not a merge) — `resolvePlugins` already owns
    //    the ordering, so we don't want to concatenate it with any
    //    stray defaults.
    merged.plugins = plugins;

    return merged;
  };
}
