/**
 * @file local-storage.resolver.ts
 * @module @stackra/i18n/react/resolvers
 * @description Resolves locale from browser localStorage.
 *
 *   Reads the user's previously saved locale preference from localStorage.
 *   Should be placed early in the resolver chain — explicit user choice
 *   takes precedence over browser/device detection.
 *
 *   ## Storage Key
 *
 *   Defaults to `"stackra_locale"`. Configurable via constructor options
 *   or inherited from the module's `storageKey` config.
 *
 *   ## SSR Safety
 *
 *   Returns `undefined` when `localStorage` is not available (SSR, Node.js).
 */

import type { II18nResolver } from "@/core/interfaces";
import type { LocalStorageResolverOptions } from "../interfaces";

/**
 * Resolves locale from browser localStorage.
 *
 * @implements {II18nResolver}
 *
 * @example
 * ```typescript
 * import { LocalStorageResolver } from '@stackra/i18n/react';
 *
 * // In resolver chain:
 * resolvers: [
 *   { use: LocalStorageResolver, options: { key: 'my_app_locale' } },
 *   NavigatorResolver,
 * ]
 * ```
 */
export class LocalStorageResolver implements II18nResolver {
  /** The localStorage key to read from. */
  private readonly key: string;

  /**
   * Creates the resolver.
   *
   * @param options - Optional configuration with storage key
   */
  public constructor(options?: LocalStorageResolverOptions) {
    this.key = options?.key ?? "stackra_locale";
  }

  /**
   * Attempt to read the locale from localStorage.
   *
   * @returns The stored locale string, or undefined if not found/unavailable
   */
  public resolve(): string | undefined {
    try {
      if (typeof localStorage === "undefined") return undefined;
      const value = localStorage.getItem(this.key);
      return value ?? undefined;
    } catch {
      // localStorage unavailable (SSR, private browsing, SecurityError)
      return undefined;
    }
  }
}
