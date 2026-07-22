/**
 * @file index.ts
 * @module @stackra/pwa/react/hooks/use-web-share
 * @description Entity barrel — re-exports the `useWebShare` hook that wraps
 *   `navigator.share`, along with its `IUseWebShareResult` return-shape
 *   interface and the `IWebShareData` payload shape.
 */

export { useWebShare } from "./use-web-share.hook";
export type { IUseWebShareResult, IWebShareData } from "./use-web-share.interface";
