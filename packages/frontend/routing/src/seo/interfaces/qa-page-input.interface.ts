/**
 * @file qa-page-input.interface.ts
 * @module @stackra/routing/seo/interfaces
 * @description Input shape for the `qaPage(...)` JSON-LD builder —
 *   Schema.org `QAPage` node fields (a single question with
 *   accepted + suggested answers).
 */

/**
 * Input shape for the `qaPage(...)` builder.
 */
export interface IQaPageInput {
  /** The question text. */
  readonly question: string;
  /** The accepted answer text. */
  readonly acceptedAnswer: string;
  /** Community-suggested answers. */
  readonly suggestedAnswers?: readonly string[];
}
