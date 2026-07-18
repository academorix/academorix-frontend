/**
 * @file index.ts
 * @module @stackra/pwa/vite
 * @description Public API for the Vite build-time adapters —
 *   `vite-plugin-pwa` and `@vite-pwa/assets-generator` config builders.
 */

export { DEFAULT_NAVIGATE_FALLBACK_DENYLIST } from './constants';
export { getVitePwaOptions, getAssetsGeneratorConfig } from './utils';
export type { IGetVitePwaOptionsInput, IGetAssetsGeneratorConfigInput } from './interfaces';
