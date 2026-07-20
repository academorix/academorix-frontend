/**
 * @file analytics-module-options.interface.ts
 * @module @stackra/analytics/core/interfaces
 * @description Package-owned configuration shape for AnalyticsModule.
 *   Mirrors the cache/logger model: a map of named provider instances
 *   (each selecting a `driver`) plus an optional `stack` filter.
 */

/** Options consumed by the built-in GA4 driver. */
export interface IGa4ProviderOptions {
  /** GA4 measurement id (`G-XXXXXXX`). */
  measurementId: string;
  /** Consent category gating GA4. Default: `'analytics'`. */
  consentCategory?: string;
}

/** Options consumed by a marketing pixel driver (Meta / TikTok / Snapchat). */
export interface IPixelProviderOptions {
  /** The pixel / advertiser id. */
  pixelId: string;
  /** Consent category gating the pixel. Default: `'marketing'`. */
  consentCategory?: string;
}

/**
 * Configuration for a single named analytics instance. `driver` selects the
 * implementation (`console`, `ga4`, `meta-pixel`, `tiktok-pixel`,
 * `snapchat-pixel`, or a custom driver); remaining fields are
 * driver-specific (e.g. `measurementId`, `pixelId`, `consentCategory`).
 */
export interface IAnalyticsInstanceConfig {
  /** Driver name. */
  driver: string;
  /** Consent category override for this instance. */
  consentCategory?: string;
  /**
   * Explicitly disable this instance without removing it. Also auto-false
   * when a built-in driver's required field is missing (e.g. GA4 without a
   * `measurementId`, a pixel without a `pixelId`) — so you can wire
   * `measurementId: import.meta.env.VITE_GA4_ID` unconditionally and let the
   * module skip it when unset.
   */
  enabled?: boolean;
  /** Driver-specific options. */
  [key: string]: unknown;
}

/**
 * Configuration for `AnalyticsModule.forRoot(...)`.
 */
export interface IAnalyticsModuleOptions {
  /** Default instance name for named access via `provider(name)`. */
  default?: string;

  /**
   * Named provider instances, keyed by instance name. Each selects a
   * `driver`. Example:
   *
   * ```ts
   * providers: {
   *   console: { driver: 'console' },
   *   ga4:     { driver: 'ga4', measurementId: 'G-XXXX' },
   *   'meta-pixel': { driver: 'meta-pixel', pixelId: '123' },
   * }
   * ```
   */
  providers?: Record<string, IAnalyticsInstanceConfig>;

  /**
   * Which instances receive fan-out. Defaults to every configured instance.
   */
  stack?: string[];

  /**
   * When a provider declares a `consentCategory` and no consent manager is
   * wired, whether to require consent (fail-closed) or fire anyway.
   * Default: `true` (privacy-first).
   */
  requireConsent?: boolean;

  /**
   * Buffer events emitted before consent is granted and replay them once
   * the relevant category is granted. Default: `true`.
   */
  bufferUntilConsent?: boolean;

  /** Max number of buffered pre-consent events (oldest dropped). Default: `100`. */
  bufferLimit?: number;
}
