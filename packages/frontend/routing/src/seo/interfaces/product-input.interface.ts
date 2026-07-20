/**
 * @file product-input.interface.ts
 * @module @stackra/routing/seo/interfaces
 * @description Input shape for the `product(...)` JSON-LD builder —
 *   Schema.org `Product` node fields with optional offer +
 *   aggregate rating.
 */

/**
 * Input shape for the `product(...)` builder.
 */
export interface IProductInput {
  /** Product name. */
  readonly name: string;
  /** Short description. */
  readonly description?: string;
  /** Image URL (or list of images). */
  readonly image?: string | readonly string[];
  /** Stock keeping unit. */
  readonly sku?: string;
  /** Brand name. */
  readonly brand?: string;
  /** Offer (price + currency). */
  readonly offer?: {
    readonly price: number | string;
    readonly currency: string;
    /** Availability enum value (e.g. `'InStock'`, `'OutOfStock'`). */
    readonly availability?: string;
    /** Absolute URL of the offer landing page. */
    readonly url?: string;
  };
  /** Aggregate rating summary. */
  readonly aggregateRating?: {
    readonly ratingValue: number | string;
    readonly reviewCount: number;
  };
}
