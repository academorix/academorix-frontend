/**
 * @file ai-draft-status.enum.ts
 * @module @stackra/contracts/enums
 * @description Status of a draft-then-confirm AI write.
 */

/** Status of an AI draft. */
export enum AiDraftStatus {
  /** Awaiting user confirmation. */
  Pending = "pending",
  /** Confirmed and applied. */
  Confirmed = "confirmed",
  /** Expired before confirmation. */
  Expired = "expired",
  /** Confirmation failed. */
  Failed = "failed",
}
