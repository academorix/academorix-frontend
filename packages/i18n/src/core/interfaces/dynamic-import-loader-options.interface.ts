/**
 * @file dynamic-import-loader-options.interface.ts
 * @module @stackra/i18n/src/interfaces
 * @description DynamicImportLoaderOptions interface.
 */

/**
 * Options for the DynamicImportLoader.
 */
export interface DynamicImportLoaderOptions {
  /** Function that returns a dynamic import promise for a locale. */
  importFn: (locale: string) => Promise<unknown>;
  /** Supported locale codes (used by languages()). */
  supportedLocales: string[];
}
