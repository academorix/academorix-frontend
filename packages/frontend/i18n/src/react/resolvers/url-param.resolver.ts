/**
 * @file url-param.resolver.ts
 * @module @stackra/i18n/react/resolvers
 * @description Resolves locale from URL query parameters or path segments.
 *
 *   Supports two detection modes:
 *   1. Query parameter: `?lang=ar` or `?locale=ar`
 *   2. Path segment: `/ar/dashboard` (first segment)
 *
 *   ## SSR Safety
 *
 *   Returns `undefined` when `window.location` is not available.
 */

import type { II18nResolver } from "@/core/interfaces";
import type { UrlParamResolverOptions } from "../interfaces";

/**
 * Resolves locale from URL query parameters or path segments.
 *
 * @implements {II18nResolver}
 *
 * @example
 * ```typescript
 * // Detects ?lang=ar AND /ar/dashboard:
 * { use: UrlParamResolver, options: { queryParam: 'lang', pathIndex: 0 } }
 * ```
 */
export class UrlParamResolver implements II18nResolver {
  /** Query parameter name(s) to check. */
  private readonly queryParams: string[];
  /** Path segment index to check (-1 = disabled). */
  private readonly pathIndex: number;

  /**
   * Creates the resolver.
   *
   * @param options - Configuration for query param names and path index
   */
  public constructor(options?: UrlParamResolverOptions) {
    const qp = options?.queryParam ?? "lang";
    this.queryParams = Array.isArray(qp) ? qp : [qp];
    this.pathIndex = options?.pathIndex ?? -1;
  }

  /**
   * Attempt to detect locale from the URL.
   *
   * Checks query parameters first, then path segment.
   *
   * @returns The detected locale, or undefined
   */
  public resolve(): string | undefined {
    try {
      if (typeof window === "undefined") return undefined;

      const url = new URL(window.location.href);

      // Check query parameters
      for (const param of this.queryParams) {
        const value = url.searchParams.get(param);
        if (value) return value;
      }

      // Check path segment
      if (this.pathIndex >= 0) {
        const segments = url.pathname.split("/").filter(Boolean);
        const segment = segments[this.pathIndex];
        // Only return if it looks like a locale code (2-5 chars, letters/hyphens)
        if (segment && /^[a-z]{2}(-[a-zA-Z]{2,4})?$/.test(segment)) {
          return segment;
        }
      }

      return undefined;
    } catch {
      return undefined;
    }
  }
}
