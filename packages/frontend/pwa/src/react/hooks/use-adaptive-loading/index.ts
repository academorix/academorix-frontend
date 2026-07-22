/**
 * @file index.ts
 * @module @stackra/pwa/react/hooks/use-adaptive-loading
 * @description Entity barrel — re-exports the `useAdaptiveLoading` hook
 *   that reads the caller's effective network quality + `save-data`
 *   preference and its `IUseAdaptiveLoadingResult` return-shape
 *   interface.
 */

export { useAdaptiveLoading } from "./use-adaptive-loading.hook";
export type { IUseAdaptiveLoadingResult } from "./use-adaptive-loading.interface";
