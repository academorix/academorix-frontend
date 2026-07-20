/**
 * @file subdomain-resolver-options.interface.ts
 * @module @stackra/i18n/src/interfaces
 * @description SubdomainResolverOptions interface.
 */

/**
 * Options for the SubdomainResolver.
 */
export interface SubdomainResolverOptions {
  /** Subdomains to exclude from locale detection. Default: ['www', 'app', 'api', 'admin'] */
  exclude?: string[];
}
