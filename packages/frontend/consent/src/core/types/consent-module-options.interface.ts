/**
 * @file consent-module-options.interface.ts
 * @module @stackra/consent/core/types
 * @description Configuration options for the consent module.
 *   Consumed by `ConsentModule.forRoot()` to configure categories,
 *   storage, and behaviour.
 */

import type { IConsentCategory } from "@stackra/contracts";

/**
 * Configuration options for the consent module.
 *
 * Passed to `ConsentModule.forRoot(options)`. Categories define what the
 * user can consent to, `storage` selects the persistence backend, and
 * `defaultMode` controls opt-in vs opt-out behaviour.
 */
export interface IConsentModuleOptions {
  /** Consent categories to register (analytics, marketing, etc.). */
  categories: IConsentCategory[];

  /**
   * Persistence backend for consent preferences.
   *
   * - `'memory'` (default) — no persistence, choices lost on reload.
   *   Used automatically when the field is omitted.
   * - `'cookie'` — persist via `document.cookie` through the
   *   `CookieStore` driver registered on `WebStorageModule`. Set
   *   `cookieName` to the cookie key, `cookieMaxAge` for the TTL.
   * - Anything else — resolved as an `IStorage` **instance name** from
   *   the app's `StorageManager`. Set `storage: 'localStorage'` (or
   *   any name declared in `WebStorageModule.forRoot({ stores })`) and
   *   the consent adapter reads/writes through that instance.
   *
   * Custom drivers register via `StorageModule.forFeature(driver, Cls)`
   * and are consumed the same way — just name them in `stores` and set
   * `storage` here to that instance name.
   */
  storage?:
    "localStorage" | "sessionStorage" | "cookie" | "memory" | "asyncStorage" | (string & {});

  /** Storage key / cookie name for persistence. Default: `'consent_preferences'`. */
  cookieName?: string;

  /** Cookie max age in seconds when using cookie storage. Default: `31536000` (365 days). */
  cookieMaxAge?: number;

  /**
   * Default consent mode. `'opt-in'` requires an explicit grant;
   * `'opt-out'` assumes granted until revoked. Default: `'opt-in'`.
   */
  defaultMode?: "opt-in" | "opt-out";

  /** Logging level for consent operations. */
  logging?: "debug" | "info" | "warn" | "error" | "silent";

  /** Whether to emit consent lifecycle events on the event bus. Default: `true`. */
  emitEvents?: boolean;
}
