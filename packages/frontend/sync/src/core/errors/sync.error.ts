/**
 * @file sync.error.ts
 * @module @stackra/sync/core/errors
 * @description Base sync error — every other sync error extends this class
 *   so consumers can catch every failure with a single `instanceof` check.
 */

/**
 * Base sync error class.
 */
export class SyncError extends Error {
  /** Machine-friendly error code. */
  public readonly code: string;

  /** Additional context (endpoint, collection, IDs, ...). */
  public readonly context?: Record<string, unknown>;

  public constructor(
    message: string,
    code: string = "SYNC_ERROR",
    context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "SyncError";
    this.code = code;
    this.context = context;

    // Preserve the stack trace where the error was thrown (V8 only).
    if (
      typeof (Error as unknown as { captureStackTrace?: unknown }).captureStackTrace === "function"
    ) {
      (
        Error as unknown as { captureStackTrace: (target: object, ctor: Function) => void }
      ).captureStackTrace(this, SyncError);
    }
  }
}
