/**
 * @file local-storage-resolver-options.interface.ts
 * @module @stackra/i18n/src/interfaces
 * @description LocalStorageResolverOptions interface.
 */

/**
 * Options for the LocalStorageResolver.
 */
export interface LocalStorageResolverOptions {
  /** localStorage key to read the locale from. Default: "stackra_locale" */
  key?: string;
}
