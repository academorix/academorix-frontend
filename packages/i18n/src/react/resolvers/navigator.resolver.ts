/**
 * @file navigator.resolver.ts
 * @module @stackra/i18n/react/resolvers
 * @description Resolves locale from the browser's `navigator.language` / `navigator.languages`.
 *
 *   Returns the browser's preferred language(s) as detected from the OS/browser settings.
 *   Typically placed last in the resolver chain as a fallback — more explicit
 *   sources (URL, cookie, localStorage) should take priority.
 *
 *   ## SSR Safety
 *
 *   Returns `undefined` when `navigator` is not available (SSR, Node.js).
 */

import type { II18nResolver } from '@/core/interfaces';

/**
 * Resolves locale from the browser's navigator language settings.
 *
 * Returns all preferred languages in order (`navigator.languages`) so the
 * module can match the first supported locale.
 *
 * @implements {II18nResolver}
 *
 * @example
 * ```typescript
 * import { NavigatorResolver } from '@stackra/i18n/react';
 *
 * // As last resolver (browser fallback):
 * resolvers: [LocalStorageResolver, CookieResolver, NavigatorResolver]
 * ```
 */
export class NavigatorResolver implements II18nResolver {
  /**
   * Read the browser's preferred languages.
   *
   * @returns Array of preferred locale codes, or undefined if unavailable
   */
  public resolve(): string[] | undefined {
    try {
      if (typeof navigator === 'undefined') return undefined;

      // navigator.languages is an ordered array of preferred languages
      if (navigator.languages && navigator.languages.length > 0) {
        return [...navigator.languages];
      }

      // Fallback to navigator.language (single value)
      if (navigator.language) {
        return [navigator.language];
      }

      return undefined;
    } catch {
      return undefined;
    }
  }
}
