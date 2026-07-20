/**
 * @file use-adaptive-loading.interface.ts
 * @module @stackra/pwa/react/hooks
 * @description Return shape for the adaptive-loading hook.
 */

/**
 * Coarse network profile reported by `navigator.connection`.
 *
 * `effectiveType` follows the Network Information API — `'slow-2g'`,
 * `'2g'`, `'3g'`, `'4g'`, or `'unknown'` when the browser doesn't
 * expose it.
 */
export interface IUseAdaptiveLoadingResult {
  /**
   * Coarse effective network type. `'unknown'` when the API is
   * unavailable (Safari, Firefox pre-recent, SSR).
   */
  readonly effectiveType: 'slow-2g' | '2g' | '3g' | '4g' | 'unknown';
  /** Whether the user has opted into data-saver mode. */
  readonly saveData: boolean;
  /**
   * Estimated downlink in Mbps as reported by the browser (may be
   * `null` when unavailable).
   */
  readonly downlink: number | null;
  /**
   * Estimated round-trip time in ms (may be `null` when unavailable).
   */
  readonly rtt: number | null;
}
