/**
 * @file web-page.util.ts
 * @module @stackra/routing/seo/json-ld
 * @description Schema.org `WebPage` JSON-LD builder.
 */

import type { IJsonLd } from "../interfaces/json-ld.interface";
import type { IWebPageInput } from "../interfaces/web-page-input.interface";

const CONTEXT = "https://schema.org" as const;

/**
 * Build a Schema.org `WebPage` node.
 *
 * @param input - Web-page fields.
 * @returns Well-formed JSON-LD node.
 */
export function webPage(input: IWebPageInput): IJsonLd {
  return {
    "@context": CONTEXT,
    "@type": "WebPage",
    name: input.name,
    url: input.url,
    ...(input.description ? { description: input.description } : {}),
    ...(input.primaryImageOfPage
      ? {
          primaryImageOfPage: {
            "@type": "ImageObject",
            url: input.primaryImageOfPage,
          },
        }
      : {}),
  };
}
