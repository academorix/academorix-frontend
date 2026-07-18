/**
 * @file http-loader-options.interface.ts
 * @module @stackra/i18n/src/interfaces
 * @description HttpLoaderOptions interface.
 */

/**
 * Options for the HttpLoader.
 */
export interface HttpLoaderOptions {
  /** URL pattern with `{locale}` placeholder (e.g., "/api/translations/{locale}"). */
  urlPattern: string;
  /** Optional URL for fetching available languages. */
  languagesUrl?: string;
  /** Fallback supported locales (used when languagesUrl is not set). */
  supportedLocales?: string[];
  /** Additional fetch options (headers, credentials, etc.). */
  fetchOptions?: RequestInit;
}
