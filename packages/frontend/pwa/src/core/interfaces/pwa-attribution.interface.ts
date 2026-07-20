/**
 * @file pwa-attribution.interface.ts
 * @module @stackra/pwa/core/interfaces
 * @description PWA install-source attribution shape.
 *
 *   Combines UTM parameters, display mode, and best-effort
 *   `document.referrer` into a single value consumers pipe into
 *   analytics on first-run.
 */

/**
 * Parsed UTM parameters read from the current URL on first paint.
 *
 * Missing parameters are omitted rather than set to empty strings so
 * `Object.keys(utm).length === 0` reads as "no attribution data".
 */
export interface IPwaUtmParams {
  /** `utm_source` (e.g. `google`, `newsletter`). */
  readonly source?: string;
  /** `utm_medium` (e.g. `email`, `cpc`). */
  readonly medium?: string;
  /** `utm_campaign` (e.g. `spring-sale`). */
  readonly campaign?: string;
  /** `utm_term` (paid-search keyword). */
  readonly term?: string;
  /** `utm_content` (creative variant). */
  readonly content?: string;
}

/**
 * Discriminated display-mode string used across the package.
 *
 * `'twa'` is included for parity with Android Trusted Web Activities —
 * we detect it via `navigator.userAgent` containing the "wv" (WebView)
 * hint alongside standalone mode.
 */
export type PwaDisplayMode = "browser" | "standalone" | "minimal-ui" | "fullscreen" | "twa";

/**
 * Composite PWA install-source attribution.
 *
 * Combines the ephemeral UTM parameters (which only exist on the first
 * navigation), the durable display mode (which sticks around every
 * session), and the referrer for organic traffic.
 */
export interface IPwaAttribution {
  /** UTM parameters read from the current URL on first paint. */
  readonly utm: IPwaUtmParams;
  /** Current display mode as detected by `matchMedia`. */
  readonly displayMode: PwaDisplayMode;
  /**
   * Referrer as reported by `document.referrer`. Empty string when
   * the referrer is unavailable (SSR, cross-origin blocked, direct
   * navigation).
   */
  readonly referrer: string;
  /**
   * Whether the app is running as an installed PWA (`standalone` or
   * `twa`) — convenience derived from `displayMode`.
   */
  readonly isInstalledContext: boolean;
}
