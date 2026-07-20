/**
 * @file index.ts
 * @module @stackra/vite
 * @description Public API for `@stackra/vite` — the neutral
 *   Vite-config orchestrator. Ships a typed `defineConfig(...)`
 *   helper and the `{ enabled, factory, options }` plugin-map
 *   envelope. Consumers bring their own plugin factories.
 */

// ════════════════════════════════════════════════════════════════════════════
// Utils — primary API
// ════════════════════════════════════════════════════════════════════════════
export { defineConfig, resolvePlugins, deepMerge } from "./utils";

// ════════════════════════════════════════════════════════════════════════════
// Interfaces (package-owned)
// ════════════════════════════════════════════════════════════════════════════
export type { IPluginEntry, IPluginMap, IViteConfigOptions } from "./interfaces";

// ════════════════════════════════════════════════════════════════════════════
// Constants
// ════════════════════════════════════════════════════════════════════════════
export { DEFAULT_VITE_CONFIG } from "./constants";

// ════════════════════════════════════════════════════════════════════════════
// Errors
// ════════════════════════════════════════════════════════════════════════════
export { ViteConfigError, PluginResolutionError } from "./errors";
