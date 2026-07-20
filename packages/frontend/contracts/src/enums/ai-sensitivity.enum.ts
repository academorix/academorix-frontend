/**
 * @file ai-sensitivity.enum.ts
 * @module @stackra/contracts/enums
 * @description Sensitivity classification for AI tools and context frames.
 */

/** Sensitivity level of an AI tool or context frame. */
export enum AiSensitivity {
  /** No sensitive data. */
  Public = "public",
  /** Personally identifiable information. */
  Pii = "pii",
  /** Financial data. */
  Financial = "financial",
  /** Medical data. */
  Medical = "medical",
  /** Safeguarding-sensitive data. */
  Safeguarding = "safeguarding",
}
