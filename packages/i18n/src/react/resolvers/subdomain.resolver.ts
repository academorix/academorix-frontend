/**
 * @file subdomain.resolver.ts
 * @module @stackra/i18n/react/resolvers
 * @description Resolves locale from the URL subdomain (e.g., ar.myapp.com → "ar").
 *
 *   Useful for multi-language deployments where each locale has its own subdomain.
 *   Excluded subdomains (www, app, api, admin) are ignored.
 *
 *   ## SSR Safety
 *
 *   Returns `undefined` when `window.location` is not available.
 */

import type { II18nResolver } from '@/core/interfaces';
import type { SubdomainResolverOptions } from '../interfaces';

/**
 * Resolves locale from the URL subdomain.
 *
 * @implements {II18nResolver}
 *
 * @example
 * ```typescript
 * // ar.myapp.com → "ar"
 * { use: SubdomainResolver, options: { exclude: ['www', 'api', 'admin'] } }
 * ```
 */
export class SubdomainResolver implements II18nResolver {
  /** Subdomains to ignore. */
  private readonly exclude: Set<string>;

  /**
   * Creates the resolver.
   *
   * @param options - Configuration with excluded subdomains
   */
  public constructor(options?: SubdomainResolverOptions) {
    this.exclude = new Set(
      options?.exclude ?? ['www', 'app', 'api', 'admin', 'cdn', 'staging', 'dev']
    );
  }

  /**
   * Attempt to detect locale from the subdomain.
   *
   * @returns The subdomain as locale code, or undefined
   */
  public resolve(): string | undefined {
    try {
      if (typeof window === 'undefined') return undefined;

      const hostname = window.location.hostname;
      const parts = hostname.split('.');

      // Need at least 3 parts (sub.domain.tld)
      if (parts.length < 3) return undefined;

      const subdomain = parts[0]!;

      // Skip excluded subdomains
      if (this.exclude.has(subdomain)) return undefined;

      // Only return if it looks like a locale code (2-3 lowercase letters)
      if (/^[a-z]{2,3}$/.test(subdomain)) {
        return subdomain;
      }

      return undefined;
    } catch {
      return undefined;
    }
  }
}
