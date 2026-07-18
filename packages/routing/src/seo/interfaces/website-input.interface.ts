/**
 * @file website-input.interface.ts
 * @module @stackra/routing/seo/interfaces
 * @description Input shape for the `website(...)` JSON-LD builder —
 *   Schema.org `WebSite` node fields with optional sitelinks
 *   search-box template.
 */

/**
 * Input shape for the `website(...)` builder.
 */
export interface IWebsiteInput {
  /** Site display name. */
  readonly name: string;
  /** Canonical site URL. */
  readonly url: string;
  /**
   * Sitelinks search-box URL template — the `{search_term_string}`
   * placeholder is replaced with the user's query.
   *
   * @example `'https://acme.com/search?q={search_term_string}'`
   */
  readonly searchUrlTemplate?: string;
}
