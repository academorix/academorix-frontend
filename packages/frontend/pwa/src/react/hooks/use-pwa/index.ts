/**
 * @file index.ts
 * @module @stackra/pwa/react/hooks/use-pwa
 * @description Entity barrel — re-exports the top-level `usePwa` hook that
 *   aggregates every PWA signal (install / update / display mode /
 *   standalone) into a single view and its `IUsePwaResult` return-shape
 *   interface.
 */

export { usePwa } from "./use-pwa.hook";
export type { IUsePwaResult } from "./use-pwa.interface";
