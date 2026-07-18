/**
 * @file alternate-link.interface.ts
 * @module @stackra/routing/seo/interfaces
 * @description Alternate-language link (`<link rel="alternate" hreflang="...">`).
 */

/**
 * Alternate-language link descriptor.
 */
export interface IAlternateLink {
  /** Language tag (e.g. `'fr'`, `'en-US'`). */
  readonly hreflang: string;
  /** URL for the alternate. */
  readonly href: string;
}
