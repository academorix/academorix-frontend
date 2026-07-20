/**
 * @file article-input.interface.ts
 * @module @stackra/routing/seo/interfaces
 * @description Input shape for the `article(...)` JSON-LD builder —
 *   Schema.org `Article` node fields.
 */

/**
 * Input shape for the `article(...)` builder.
 */
export interface IArticleInput {
  /** Headline (max 110 chars for AMP). */
  readonly headline: string;
  /** Short description of the article. */
  readonly description?: string;
  /** Image URL (or list of images). */
  readonly image?: string | readonly string[];
  /** ISO-8601 publication timestamp. */
  readonly datePublished: string;
  /** ISO-8601 last-modified timestamp. */
  readonly dateModified?: string;
  /** Author name. */
  readonly authorName: string;
  /** Publisher name (usually the site's org name). */
  readonly publisherName?: string;
  /** Publisher logo URL. */
  readonly publisherLogo?: string;
}
