/**
 * @file index.ts
 * @module @stackra/cache/react/hooks
 * @description Barrel export for all cache React hooks.
 *
 *   Each hook lives in its own folder (`use-cache/`, `use-cache-manager/`,
 *   `use-cache-value/`) per the one-folder-per-unit convention. The
 *   folder barrel re-exports the hook module so this top-level barrel
 *   only imports from the folder, not the hook file.
 */

export { useCache } from "./use-cache";
export { useCacheManager } from "./use-cache-manager";
export { useCacheValue, type IUseCacheValueResult } from "./use-cache-value";
