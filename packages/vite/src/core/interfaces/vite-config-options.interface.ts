/**
 * @file vite-config-options.interface.ts
 * @module @stackra/vite/core/interfaces
 * @description The shape accepted by `defineConfig(...)` — extends
 *   Vite's `UserConfig` and swaps its `plugins: PluginOption[]` for
 *   the typed plugin-map envelope {@link IPluginMap}.
 */

import type { UserConfig } from "vite";
import type { IPluginMap } from "./plugin-map.interface";

/**
 * The shape accepted by `defineConfig(...)`.
 *
 * Extends Vite's `UserConfig` — every standard Vite option
 * (`server`, `build`, `resolve`, `css`, `optimizeDeps`, ...) is
 * available with full IntelliSense — but replaces the native
 * `plugins: PluginOption[]` field with the typed plugin-map
 * envelope {@link IPluginMap}. The map is resolved into a
 * `Plugin[]` array by `defineConfig(...)` before being handed to
 * Vite.
 *
 * @example
 * ```typescript
 * import type { IViteConfigOptions } from '@stackra/vite';
 *
 * const config: IViteConfigOptions = {
 *   plugins: {},
 *   server: { port: 3000 },
 * };
 * ```
 */
export interface IViteConfigOptions extends Omit<UserConfig, "plugins"> {
  /**
   * Plugin map — key → `{ enabled, factory, options }` envelope.
   * Resolved into a `Plugin[]` array by `defineConfig(...)` before
   * being handed to Vite. Optional — a config without plugins is
   * perfectly valid.
   */
  readonly plugins?: IPluginMap;
}
