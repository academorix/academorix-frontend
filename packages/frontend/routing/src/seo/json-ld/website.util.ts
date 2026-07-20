/**
 * @file website.util.ts
 * @module @stackra/routing/seo/json-ld
 * @description Schema.org `WebSite` JSON-LD builder.
 *
 *   Represents the site itself, optionally with a sitelinks search
 *   box that lets Google's SERP surface an inline site-search input.
 */

import type { IJsonLd } from "../interfaces/json-ld.interface";
import type { IWebsiteInput } from "../interfaces/website-input.interface";

const CONTEXT = "https://schema.org" as const;

/**
 * Build a Schema.org `WebSite` node.
 *
 * @param input - Website fields.
 * @returns Well-formed JSON-LD node.
 */
export function website(input: IWebsiteInput): IJsonLd {
  return {
    "@context": CONTEXT,
    "@type": "WebSite",
    name: input.name,
    url: input.url,
    ...(input.searchUrlTemplate
      ? {
          potentialAction: {
            "@type": "SearchAction",
            target: {
              "@type": "EntryPoint",
              urlTemplate: input.searchUrlTemplate,
            },
            // `query-input` is Schema.org's canonical shape for the
            // required search token — hard-coded because Google only
            // recognises this exact string.
            "query-input": "required name=search_term_string",
          },
        }
      : {}),
  };
}
