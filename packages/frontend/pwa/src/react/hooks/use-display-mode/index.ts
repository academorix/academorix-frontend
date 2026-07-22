/**
 * @file index.ts
 * @module @stackra/pwa/react/hooks/use-display-mode
 * @description Entity barrel — re-exports the `useDisplayMode` hook that
 *   reads the current PWA display mode (`browser` / `standalone` /
 *   `minimal-ui` / …) and its `PwaDisplayMode` union.
 */

export { useDisplayMode } from "./use-display-mode.hook";
export type { PwaDisplayMode } from "./use-display-mode.interface";
