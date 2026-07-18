/**
 * @file faq-page.util.ts
 * @module @stackra/routing/seo/json-ld
 * @description Schema.org `FAQPage` JSON-LD builder.
 *
 *   Answer-engine (AEO) optimisation — answer engines extract these
 *   Q&A pairs directly into featured snippets and voice answers.
 */

import type { IFaqEntryInput } from "../interfaces/faq-entry-input.interface";
import type { IJsonLd } from "../interfaces/json-ld.interface";

const CONTEXT = "https://schema.org" as const;

/**
 * Build a Schema.org `FAQPage` node.
 *
 * @param items - Q&A pairs.
 * @returns Well-formed JSON-LD node.
 */
export function faqPage(items: readonly IFaqEntryInput[]): IJsonLd {
  return {
    "@context": CONTEXT,
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}
