/**
 * @file ai-draft.error.ts
 * @module @stackra/ai/core/errors
 * @description Failure confirming a draft-then-confirm write. The draft
 *   remains pending on the client so the user can retry.
 */

import { AiError } from "./ai.error";

/**
 * Thrown by `DraftService.confirm` when the backend rejects the confirm.
 *
 * The `draftId` is preserved so consumers can surface a descriptive error
 * and keep the draft in the pending state (Req 16.4).
 */
export class AiDraftError extends AiError {
  /**
   * @param message - Human-readable error description.
   * @param draftId - Identifier of the draft that failed to confirm.
   * @param cause - The originating error from the backend.
   */
  public constructor(
    message: string,
    public readonly draftId: string,
    cause?: unknown,
  ) {
    super(message, cause);
  }
}
