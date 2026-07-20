/**
 * @file web-page-input.interface.ts
 * @module @stackra/routing/seo/interfaces
 * @description Input shape for the `webPage(...)` JSON-LD builder —
 *   Schema.org `WebPage` node fields.
 */

/**
 * Input shape for the `webPage(...)` builder.
 */
export interface IWebPageInput {
  /** Page title. */
  readonly name: string;
  /** Canonical page URL. */
  readonly url: string;
  /** Meta description. */
  readonly description?: string;
  /** URL of the primary image of the page. */
  readonly primaryImageOfPage?: string;
}
