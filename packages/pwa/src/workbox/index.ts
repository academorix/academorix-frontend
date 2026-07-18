/**
 * @file index.ts
 * @module @stackra/pwa/workbox
 * @description Public API for the curated Workbox runtime-caching rules.
 *
 *   Consumers pass the returned array to `vite-plugin-pwa`'s
 *   `workbox.runtimeCaching` or to Serwist's `runtimeCaching`.
 */

export { getRuntimeCaching } from './utils';
export type { IRuntimeCachingRule, IRuntimeCachingOptions } from './interfaces';
