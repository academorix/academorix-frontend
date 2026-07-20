/**
 * @file json-ld.interface.ts
 * @module @stackra/routing/seo/interfaces
 * @description Schema.org JSON-LD document shape.
 *
 *   JSON-LD (`<script type="application/ld+json">`) is the primary
 *   structured-data format search engines and answer engines (AEO)
 *   consume. The interface is intentionally open — a JSON-LD node is
 *   any object with a `@type` (and usually `@context`). Builder helpers
 *   in `../utils/*.util.ts` produce well-formed common documents.
 */

/**
 * A single JSON-LD node.
 *
 * `@context` defaults to `https://schema.org` when produced by the
 * builders; arbitrary Schema.org properties are allowed.
 */
export interface IJsonLd {
  /** Schema.org context URL — usually `'https://schema.org'`. */
  readonly "@context"?: string;

  /** Schema.org type name (`Organization`, `Article`, …). */
  readonly "@type": string;

  /** Any additional Schema.org properties. */
  readonly [property: string]: unknown;
}
