/**
 * @file cookie-resolver-options.interface.ts
 * @module @stackra/i18n/src/interfaces
 * @description CookieResolverOptions interface.
 */

/**
 * Options for the CookieResolver.
 */
export interface CookieResolverOptions {
  /** Cookie name(s) to check in priority order. Default: ["lang", "locale"] */
  cookieNames?: string[];
}
