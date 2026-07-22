/**
 * @file cookie.store.ts
 * @module @stackra/storage/react/stores
 * @description `IStorage` backed by `document.cookie` — the last
 *   piece of the storage-driver family, closes the gap for
 *   consent (`storage: 'cookie'`) and lets `i18n/CookieResolver`
 *   retire its own parser.
 *
 *   Cookies are a special browser storage type: values are strings,
 *   size is capped (~4KB per cookie, ~50 cookies per domain), and
 *   every cookie ships with every request to the origin — so this
 *   driver is best-suited for TINY values (locale, feature flag
 *   choices, consent preferences) not blob-shaped data.
 */

import type { IStorage, IStorageSetOptions } from "@stackra/contracts";
import { Str } from "@stackra/support";

import { prefixKey, stripPrefix } from "@/core/utils/prefix-key.util";

/**
 * Constructor config accepted by `CookieStore`.
 */
export interface CookieStoreConfig {
  /**
   * Key prefix applied to every cookie name. Defaults to `''`.
   * Callers usually pass the instance name so multiple `IStorage`
   * instances backed by cookies coexist without collision.
   */
  readonly prefix?: string;

  /**
   * Default cookie max age in seconds when a `set()` call doesn't
   * supply `ttlSeconds`. Omitted = session cookie (expires when the
   * browser tab closes).
   */
  readonly maxAge?: number;

  /**
   * Cookie path. Defaults to `'/'` — cookies scoped to the whole
   * origin.
   */
  readonly path?: string;

  /**
   * Cookie domain. Omitted = the current origin's exact host.
   */
  readonly domain?: string;

  /**
   * `SameSite` attribute. Defaults to `'Lax'` — the modern browser
   * default that keeps cookies for top-level GETs (locale, consent
   * choice) but drops them for cross-site subresource requests.
   */
  readonly sameSite?: "Strict" | "Lax" | "None";

  /**
   * Only send the cookie over HTTPS. Defaults to `false` because
   * localhost dev servers on HTTP need to work; production apps
   * should set this to `true`.
   */
  readonly secure?: boolean;
}

/**
 * `IStorage` implementation persisting to `document.cookie`.
 *
 * Values are JSON-serialised on write and JSON-parsed on read.
 * Every method is fail-soft — SSR, non-DOM, quota, or
 * cookie-disabled cases all resolve to `null` reads and swallowed
 * writes.
 *
 * @example
 * ```typescript
 * // Registered by WebStorageModule when the caller declares an
 * // instance with driver: 'cookie':
 * WebStorageModule.forRoot({
 *   default: 'consent',
 *   stores: {
 *     consent: {
 *       driver: 'cookie',
 *       prefix: 'app',
 *       maxAge: 31_536_000,   // 1 year
 *       sameSite: 'Lax',
 *       secure: true,
 *     },
 *   },
 * });
 * ```
 */
export class CookieStore implements IStorage {
  private readonly prefix: string;
  private readonly defaultMaxAge?: number;
  private readonly path: string;
  private readonly domain?: string;
  private readonly sameSite: "Strict" | "Lax" | "None";
  private readonly secure: boolean;

  /**
   * @param config - Optional cookie-specific defaults.
   */
  public constructor(config: CookieStoreConfig = {}) {
    this.prefix = config.prefix ?? "";
    this.defaultMaxAge = config.maxAge;
    this.path = config.path ?? "/";
    this.sameSite = config.sameSite ?? "Lax";
    this.secure = config.secure ?? false;
    if (config.domain) this.domain = config.domain;
  }

  /** @inheritdoc */
  public async get<T>(key: string): Promise<T | null> {
    if (!this.isAvailable()) return null;
    try {
      const raw = this.readCookieValue(prefixKey(this.prefix, key));
      if (raw === null) return null;
      return JSON.parse(raw) as T;
    } catch {
      // fail-soft — corrupt JSON, disabled cookies.
      return null;
    }
  }

  /** @inheritdoc */
  public async set<T>(key: string, value: T, options?: IStorageSetOptions): Promise<void> {
    if (!this.isAvailable()) return;
    try {
      const encoded = encodeURIComponent(JSON.stringify(value));
      const maxAge = options?.ttlSeconds ?? this.defaultMaxAge;
      document.cookie = this.buildCookieString(prefixKey(this.prefix, key), encoded, maxAge);
    } catch {
      // fail-soft — cookie set can throw if the value is too big or
      // the browser is in "block all cookies" mode.
    }
  }

  /** @inheritdoc */
  public async delete(key: string): Promise<void> {
    if (!this.isAvailable()) return;
    // Set an empty value with a max-age of 0 to expire immediately.
    document.cookie = this.buildCookieString(prefixKey(this.prefix, key), "", 0);
  }

  /** @inheritdoc */
  public async clear(): Promise<void> {
    if (!this.isAvailable()) return;
    for (const name of this.parseCookieNames()) {
      const userKey = stripPrefix(this.prefix, name);
      if (userKey === null) continue;
      document.cookie = this.buildCookieString(name, "", 0);
    }
  }

  /** @inheritdoc */
  public async has(key: string): Promise<boolean> {
    if (!this.isAvailable()) return false;
    return this.readCookieValue(prefixKey(this.prefix, key)) !== null;
  }

  /** @inheritdoc */
  public async keys(): Promise<string[]> {
    if (!this.isAvailable()) return [];
    const names = this.parseCookieNames();
    const owned: string[] = [];
    for (const name of names) {
      const userKey = stripPrefix(this.prefix, name);
      if (userKey !== null) owned.push(userKey);
    }
    return owned;
  }

  // ── Private helpers ─────────────────────────────────────────────

  /**
   * Whether `document.cookie` is accessible in this environment.
   * SSR / worker contexts return `false`.
   */
  private isAvailable(): boolean {
    return typeof document !== "undefined" && typeof document.cookie === "string";
  }

  /**
   * Parse `document.cookie` into a map, return the raw value for a
   * given cookie name (URI-decoded) or `null` when absent.
   */
  private readCookieValue(name: string): string | null {
    const cookieString = document.cookie;
    if (!cookieString) return null;

    const target = `${name}=`;
    for (const part of cookieString.split(";")) {
      const trimmed = Str.trim(part);
      if (Str.startsWith(trimmed, target)) {
        return decodeURIComponent(trimmed.slice(target.length));
      }
    }
    return null;
  }

  /**
   * Extract every cookie name currently in `document.cookie`. Used
   * by `keys()` and `clear()`.
   */
  private parseCookieNames(): string[] {
    const cookieString = document.cookie;
    if (!cookieString) return [];

    const names: string[] = [];
    for (const part of cookieString.split(";")) {
      const trimmed = Str.trim(part);
      const equalsIdx = trimmed.indexOf("=");
      if (equalsIdx < 0) continue;
      names.push(trimmed.slice(0, equalsIdx));
    }
    return names;
  }

  /**
   * Build a `Set-Cookie`-formatted string for `document.cookie`.
   *
   * @param name - Cookie name (already prefixed).
   * @param value - URI-encoded value (empty for delete).
   * @param maxAge - Cookie `Max-Age` in seconds. `undefined` =
   *   session cookie; `0` = expire immediately (delete).
   */
  private buildCookieString(name: string, value: string, maxAge?: number): string {
    const parts: string[] = [`${name}=${value}`, `path=${this.path}`, `SameSite=${this.sameSite}`];
    if (this.domain) parts.push(`domain=${this.domain}`);
    if (this.secure) parts.push("Secure");
    if (maxAge !== undefined) parts.push(`Max-Age=${maxAge}`);
    return parts.join("; ");
  }
}
