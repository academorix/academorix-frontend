/**
 * @file url-param-resolver-options.interface.ts
 * @module @stackra/i18n/src/interfaces
 * @description UrlParamResolverOptions interface.
 */

/**
 * Options for the UrlParamResolver.
 */
export interface UrlParamResolverOptions {
  /** Query parameter name(s) to check. Default: "lang" */
  queryParam?: string | string[];
  /** Path segment index to check (0 = first segment after /). Set to -1 to disable. Default: -1 */
  pathIndex?: number;
}
