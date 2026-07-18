/**
 * @file analytics-csp.interface.ts
 * @module @stackra/analytics/core/interfaces
 * @description CSP directive contribution shape for providers that inject
 *   third-party scripts (marketing pixels). Fed to `CspModule.forFeature`.
 */

/**
 * The CSP directive sources a script-injecting provider needs allow-listed.
 * Shaped to drop straight into `@stackra/csp`'s `forFeature(policy)`.
 */
export interface IAnalyticsCspDirectives {
  /** Named policy fragment (e.g. `analytics:meta-pixel`). */
  name: string;
  /** `script-src` entries (the pixel/SDK script origin). */
  scriptSrc?: string[];
  /** `img-src` entries (tracking-pixel image beacons). */
  imgSrc?: string[];
  /** `connect-src` entries (XHR/beacon endpoints). */
  connectSrc?: string[];
  /** `frame-src` entries (iframe-based fallbacks). */
  frameSrc?: string[];
}
