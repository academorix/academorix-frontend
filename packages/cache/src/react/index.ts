/**
 * @file index.ts
 * @module @stackra/cache/react
 * @description Public API for the cache React subpath.
 *   Provides React hooks for accessing cache services from DI, plus the
 *   `@stackra/devtools` panel contribution.
 *   Import via `@stackra/cache/react`.
 */

// ════════════════════════════════════════════════════════════════════════════════
// Hooks
// ════════════════════════════════════════════════════════════════════════════════
export { useCache } from "./hooks";
export { useCacheManager } from "./hooks";
export { useCacheValue, type IUseCacheValueResult } from "./hooks";

// ════════════════════════════════════════════════════════════════════════════════
// Devtools contribution — pending
//
// The `CacheDevtoolsPanel` used to live under `./devtools/` and re-export
// from here. It depends on `@stackra/devtools`, which is not yet promoted.
// Restore this block once that package lands:
//   export { CacheDevtoolsPanel, CacheDevtoolsPanelView,
//            type CacheDevtoolsPanelViewProps } from './devtools';
// ════════════════════════════════════════════════════════════════════════════════
