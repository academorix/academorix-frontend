/**
 * @file vite.config.ts
 * @module @stackra/vite/config
 * @description Application-level Vite plugin registry template.
 *   Consumed by `defineConfig(...)` from `@stackra/vite`. Copy
 *   this file into your app's `src/config/` directory and
 *   customise the plugin map to your needs.
 */

import type { IViteConfigOptions } from "@stackra/vite";

/**
 * Vite configuration for the application.
 *
 * Each key of `plugins` is a `{ enabled, factory, options }`
 * envelope. Toggling a plugin flips `enabled` — the factory is
 * only invoked when `enabled === true`, so a disabled entry has
 * zero side-effect cost.
 *
 * @example
 * ```typescript
 * // Wire the config in your top-level `vite.config.ts`:
 * import { defineConfig } from '@stackra/vite';
 * import { viteConfig } from '@/config/vite.config';
 *
 * export default defineConfig(viteConfig);
 * ```
 */
export const viteConfig: IViteConfigOptions = {
  plugins: {
    // Fill this in with your app's plugins. Each entry is
    // `{ enabled: boolean; factory: (options) => Plugin | Plugin[]; options: T }`.
    //
    // Example:
    //
    //   react: {
    //     enabled: true,
    //     factory: react,
    //     options: { tsDecorators: true },
    //   },
    //   tsconfigPaths: {
    //     enabled: true,
    //     factory: tsconfigPaths,
    //     options: {},
    //   },
  },
};
