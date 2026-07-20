/**
 * @file faq-entry-input.interface.ts
 * @module @stackra/routing/seo/interfaces
 * @description Input shape for a single Q&A pair in the
 *   `faqPage(...)` JSON-LD builder — one `Question` /
 *   `acceptedAnswer` couple.
 */

/**
 * One FAQ entry.
 */
export interface IFaqEntryInput {
  /** Question text. */
  readonly question: string;
  /** Accepted answer text. */
  readonly answer: string;
}
