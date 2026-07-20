/**
 * @file breadcrumb-list.util.ts
 * @module @stackra/routing/seo/json-ld
 * @description Schema.org `BreadcrumbList` JSON-LD builder.
 *
 *   Produces a navigation-context node search engines display as a
 *   breadcrumb trail in SERP results.
 */

import type { IBreadcrumbEntryInput } from "../interfaces/breadcrumb-entry-input.interface";
import type { IJsonLd } from "../interfaces/json-ld.interface";

const CONTEXT = "https://schema.org" as const;

/**
 * Build a Schema.org `BreadcrumbList` node.
 *
 * @param items - Breadcrumb entries in navigation order (root first).
 * @returns Well-formed JSON-LD node.
 */
export function breadcrumbList(items: readonly IBreadcrumbEntryInput[]): IJsonLd {
  return {
    "@context": CONTEXT,
    "@type": "BreadcrumbList",
    // Position is 1-indexed per the Schema.org spec.
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
