/**
 * @file qa-page.util.ts
 * @module @stackra/routing/seo/json-ld
 * @description Schema.org `QAPage` JSON-LD builder.
 *
 *   AEO variant for a single question with community answers.
 */

import type { IJsonLd } from "../interfaces/json-ld.interface";
import type { IQaPageInput } from "../interfaces/qa-page-input.interface";

const CONTEXT = "https://schema.org" as const;

/**
 * Build a Schema.org `QAPage` node.
 *
 * @param input - Q&A fields.
 * @returns Well-formed JSON-LD node.
 */
export function qaPage(input: IQaPageInput): IJsonLd {
  return {
    "@context": CONTEXT,
    "@type": "QAPage",
    mainEntity: {
      "@type": "Question",
      name: input.question,
      acceptedAnswer: { "@type": "Answer", text: input.acceptedAnswer },
      ...(input.suggestedAnswers
        ? {
            suggestedAnswer: input.suggestedAnswers.map((text) => ({
              "@type": "Answer",
              text,
            })),
          }
        : {}),
    },
  };
}
