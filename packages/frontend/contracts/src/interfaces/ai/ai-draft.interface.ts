/**
 * @file ai-draft.interface.ts
 * @module @stackra/contracts/interfaces/ai
 * @description A pending backend write produced by the draft-then-confirm flow.
 */

import type { AiDraftStatus } from "@/enums/ai-draft-status.enum";

/** A draft-then-confirm write. */
export interface IAiDraft {
  /** Draft identifier. */
  id: string;
  /** Action key, e.g. `orders.order.refund`. */
  actionKey: string;
  /** Human-readable summary of the pending write. */
  summary: string;
  /** The write payload. */
  payload: unknown;
  /** Current draft status. */
  status: AiDraftStatus;
}
