/**
 * @file i18n-config.interface.ts
 * @module @stackra/i18n/core/interfaces
 * @description Full module configuration interface for I18nModule.forRoot().
 */

import type { II18nLoader } from "@stackra/contracts";

import type { I18nResolverConfig } from "./i18n-resolver.interface";

/**
 * Language fallback mapping.
 * Maps locale codes (or wildcards) to their fallback locale.
 *
 * @example
 * ```typescript
 * fallbacks: {
 *   "en-US": "en",
 *   "ar-*": "ar",    // wildcard: any ar-XX falls back to ar
 *   "fr-CA": "fr",
 * }
 * ```
 */
export type I18nFallbacks = Record<string, string>;

/**
 * Interpolation configuration.
 */
export interface I18nInterpolation {
  /** Opening delimiter for variables. Default: `"{{"`  */
  prefix?: string;
  /** Closing delimiter for variables. Default: `"}}"` */
  suffix?: string;
}

/**
 * Full module configuration for `I18nModule.forRoot()`.
 */
export interface II18nConfig {
  /** The default locale when no resolver matches. */
  defaultLocale: string;

  /** Fallback locale for missing keys (defaults to defaultLocale). */
  fallbackLocale?: string;

  /** List of supported locale codes. */
  supportedLocales: string[];

  /** Language fallback mapping (locale → fallback locale). */
  fallbacks?: I18nFallbacks;

  /** Ordered list of locale resolvers. First non-null wins. */
  resolvers?: I18nResolverConfig[];

  /** The loader class or driver name for fetching translations. */
  loader?: { new (...args: any[]): II18nLoader } | string;

  /** Options passed to the loader constructor. */
  loaderOptions?: unknown;

  /** Custom string formatter function. */
  formatter?: (template: string, ...args: (string | Record<string, unknown>)[]) => string;

  /** Interpolation delimiter configuration. */
  interpolation?: I18nInterpolation;

  /** Enable console logging for missing keys and errors. Default: `true` */
  logging?: boolean;

  /** Throw an error when a translation key is missing. Default: `false` */
  throwOnMissingKey?: boolean;

  /** Key separator for nested paths. Set `false` to disable. Default: `"."` */
  keySeparator?: string | false;

  /** Namespace separator. Set `false` to disable. Default: `false` */
  nsSeparator?: string | false;

  /** Return nested objects/arrays instead of stringifying. Default: `true` */
  returnObjects?: boolean;

  /** Join array translations with this delimiter. */
  joinArrays?: string;

  /** Enable ICU MessageFormat support. Default: `false` */
  useICU?: boolean;

  /** Persist locale selection to storage. Default: `true` */
  persistLocale?: boolean;

  /**
   * Named `IStorage` instance to persist the locale into (looked up
   * on the app's `StorageManager`).
   *
   * - `undefined` (default) — no persistence (locale reset per session).
   * - `'localStorage'` / `'sessionStorage'` / `'asyncStorage'` — the
   *   conventional names for the built-in web / native drivers.
   * - Any other string — a custom instance name declared by the app
   *   (or a driver registered via `StorageModule.forFeature`).
   *
   * Requires `WebStorageModule` / `NativeStorageModule` imported
   * upstream with a matching `stores` entry.
   */
  storage?: "localStorage" | "sessionStorage" | "asyncStorage" | (string & {});

  /** Storage key for locale persistence. Default: `"stackra_locale"` */
  storageKey?: string;

  /** Initial locale override (resolved from resolvers if not set). */
  initialLocale?: string;

  /** Auto-detect locale from browser navigator.language. Default: `false` */
  autoDetect?: boolean;

  /** RTL locale codes. Default: ['ar', 'he', 'fa', 'ur', 'ps', 'sd', 'yi', 'ku'] */
  rtlLocales?: string[];

  /** Missing key behavior: 'key' | 'empty' | 'throw'. Default: 'key' */
  missingKeyBehavior?: "key" | "empty" | "throw";
}
