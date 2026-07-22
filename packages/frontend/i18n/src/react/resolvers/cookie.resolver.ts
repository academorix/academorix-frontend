/**
 * @file cookie.resolver.ts
 * @module @stackra/i18n/react/resolvers
 * @description Legacy cookie-backed locale resolver.
 *
 *   Reads `document.cookie` for a small allowlist of cookie names
 *   (default: `['lang', 'locale']`) and returns the first match.
 *
 *   ## Preferred alternative
 *
 *   New code should assemble a `StorageBackedLocaleAdapter` on top
 *   of the `cookie` driver registered by
 *   `WebStorageModule.forRoot({ stores: { locale: { driver: 'cookie', ... } } })`
 *   instead of using this resolver. That path also handles WRITING
 *   the locale back to the cookie, whereas this resolver is
 *   READ-ONLY. This class remains only to accommodate the legacy
 *   server-set-cookie case where the SSR layer emits a bare string
 *   value (`lang=en`) that `CookieStore`'s JSON-encoded reads
 *   cannot parse.
 *
 *   ## SSR safety
 *
 *   Returns `undefined` when `document.cookie` is not available
 *   (Node runtime, worker, hardened iframe).
 */

import { Str } from "@stackra/support";

import type { II18nResolver } from "@/core/interfaces";
import type { CookieResolverOptions } from "../interfaces";

/**
 * Legacy locale resolver that reads bare-string cookie values.
 *
 * Kept as a compatibility shim for apps whose SSR layer still emits
 * plain-string cookies (`Set-Cookie: lang=en`) that predate the
 * JSON-encoded persistence introduced by `@stackra/storage`'s
 * `CookieStore`.
 *
 * @implements {II18nResolver}
 *
 * @example
 * ```typescript
 * import { CookieResolver } from '@stackra/i18n/react';
 *
 * { use: CookieResolver, options: { cookieNames: ['lang', 'i18n_locale'] } }
 * ```
 */
export class CookieResolver implements II18nResolver {
  /** Cookie names to check, in priority order. */
  private readonly cookieNames: string[];

  /**
   * @param options - Configuration with cookie names.
   */
  public constructor(options?: CookieResolverOptions) {
    this.cookieNames = options?.cookieNames ?? ["lang", "locale"];
  }

  /**
   * Attempt to read a locale from `document.cookie`.
   *
   * Walks the cookie string once per requested name — no full-parse
   * / map allocation, no dependency on `@stackra/storage`. The
   * general-purpose cookie parser now lives in `CookieStore`; this
   * resolver only needs a targeted lookup for a small allowlist.
   *
   * @returns The first matching cookie's raw (URI-decoded) value,
   *   or `undefined` when none of the allowlisted cookies are
   *   present.
   */
  public resolve(): string | undefined {
    // Fail-soft — SSR / non-DOM environments have no cookies.
    if (typeof document === "undefined") return undefined;

    try {
      const cookieString = document.cookie;
      if (!cookieString) return undefined;

      for (const name of this.cookieNames) {
        const value = readCookieValue(cookieString, name);
        if (value) return value;
      }
      return undefined;
    } catch {
      // fail-soft — some browsers throw on `document.cookie` access
      // inside sandboxed iframes.
      return undefined;
    }
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// Private helper — targeted lookup
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Read a single cookie's URI-decoded value out of a raw
 * `document.cookie` string, or return `undefined` when the cookie
 * is not present.
 *
 * @param cookieString - The raw `document.cookie` string.
 * @param name - Cookie name to look up.
 * @returns The decoded value, or `undefined` when absent.
 */
function readCookieValue(cookieString: string, name: string): string | undefined {
  const target = `${name}=`;
  for (const part of cookieString.split(";")) {
    const trimmed = Str.trim(part);
    if (Str.startsWith(trimmed, target)) {
      return decodeURIComponent(trimmed.slice(target.length));
    }
  }
  return undefined;
}
