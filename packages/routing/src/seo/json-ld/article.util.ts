/**
 * @file article.util.ts
 * @module @stackra/routing/seo/json-ld
 * @description Schema.org `Article` JSON-LD builder.
 *
 *   Article / blog-post rich result. Includes headline, dates,
 *   author, and optional publisher — the four fields Google requires
 *   for the Article rich card.
 */

import type { IArticleInput } from "../interfaces/article-input.interface";
import type { IJsonLd } from "../interfaces/json-ld.interface";

const CONTEXT = "https://schema.org" as const;

/**
 * Build a Schema.org `Article` node.
 *
 * @param input - Article fields.
 * @returns Well-formed JSON-LD node.
 */
export function article(input: IArticleInput): IJsonLd {
  return {
    "@context": CONTEXT,
    "@type": "Article",
    headline: input.headline,
    ...(input.description ? { description: input.description } : {}),
    ...(input.image ? { image: input.image } : {}),
    datePublished: input.datePublished,
    ...(input.dateModified ? { dateModified: input.dateModified } : {}),
    author: { "@type": "Person", name: input.authorName },
    ...(input.publisherName
      ? {
          publisher: {
            "@type": "Organization",
            name: input.publisherName,
            ...(input.publisherLogo
              ? {
                  logo: { "@type": "ImageObject", url: input.publisherLogo },
                }
              : {}),
          },
        }
      : {}),
  };
}
