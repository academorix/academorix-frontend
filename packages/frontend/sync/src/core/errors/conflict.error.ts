/**
 * @file conflict.error.ts
 * @module @stackra/sync/core/errors
 * @description Error thrown when the conflict resolver cannot produce a
 *   resolution for an {@link IConflict}.
 */

import type { IConflict } from "@stackra/contracts";
import { SyncError } from "./sync.error";

/**
 * Error raised when a conflict cannot be resolved by the configured
 * strategy.
 */
export class ConflictError extends SyncError {
  /** The conflict that failed to resolve. */
  public readonly conflict: IConflict;

  public constructor(message: string, conflict: IConflict, context?: Record<string, unknown>) {
    super(message, "CONFLICT_ERROR", { ...context, conflict });
    this.name = "ConflictError";
    this.conflict = conflict;

    if (
      typeof (Error as unknown as { captureStackTrace?: unknown }).captureStackTrace === "function"
    ) {
      (
        Error as unknown as { captureStackTrace: (target: object, ctor: Function) => void }
      ).captureStackTrace(this, ConflictError);
    }
  }
}
