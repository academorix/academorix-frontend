/**
 * @file index.ts
 * @module @stackra/i18n/core/loaders
 * @description Barrel export for built-in translation loaders.
 *   Loader-option interfaces (`StaticLoaderOptions`, `HttpLoaderOptions`,
 *   `DynamicImportLoaderOptions`) live in `../interfaces` and are
 *   re-exported by the interfaces barrel.
 */

export { StaticLoader } from './static.loader';
export { DynamicImportLoader } from './dynamic-import.loader';
export { HttpLoader } from './http.loader';
