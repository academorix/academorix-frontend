/**
 * @file speakable.util.ts
 * @module @stackra/routing/seo/json-ld
 * @description Schema.org `SpeakableSpecification` JSON-LD builder.
 *
 *   AEO — marks CSS selectors whose content is suitable for
 *   text-to-speech (voice assistants).
 */

import type { IJsonLd } from "../interfaces/json-ld.interface";

const CONTEXT = "https://schema.org" as const;

/**
 * Build a Schema.org `SpeakableSpecification` node.
 *
 * @param cssSelectors - CSS selectors whose content should be spoken.
 * @returns Well-formed JSON-LD node.
 */
export function speakable(cssSelectors: readonly string[]): IJsonLd {
  return {
    "@context": CONTEXT,
    "@type": "SpeakableSpecification",
    cssSelector: cssSelectors,
  };
}
