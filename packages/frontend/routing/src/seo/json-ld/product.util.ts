/**
 * @file product.util.ts
 * @module @stackra/routing/seo/json-ld
 * @description Schema.org `Product` JSON-LD builder.
 *
 *   Product rich result with optional offer + aggregate rating.
 *   Google surfaces price / availability / rating stars in SERP.
 */

import type { IJsonLd } from "../interfaces/json-ld.interface";
import type { IProductInput } from "../interfaces/product-input.interface";

const CONTEXT = "https://schema.org" as const;

/**
 * Build a Schema.org `Product` node.
 *
 * @param input - Product fields.
 * @returns Well-formed JSON-LD node.
 */
export function product(input: IProductInput): IJsonLd {
  return {
    "@context": CONTEXT,
    "@type": "Product",
    name: input.name,
    ...(input.description ? { description: input.description } : {}),
    ...(input.image ? { image: input.image } : {}),
    ...(input.sku ? { sku: input.sku } : {}),
    ...(input.brand ? { brand: { "@type": "Brand", name: input.brand } } : {}),
    ...(input.offer
      ? {
          offers: {
            "@type": "Offer",
            price: input.offer.price,
            priceCurrency: input.offer.currency,
            ...(input.offer.availability
              ? {
                  // Schema.org's availability enum is expressed as a full
                  // URL — prefix the caller-supplied token.
                  availability: `https://schema.org/${input.offer.availability}`,
                }
              : {}),
            ...(input.offer.url ? { url: input.offer.url } : {}),
          },
        }
      : {}),
    ...(input.aggregateRating
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: input.aggregateRating.ratingValue,
            reviewCount: input.aggregateRating.reviewCount,
          },
        }
      : {}),
  };
}
