/**
 * @file notification.error.ts
 * @module @stackra/notifications/core/errors
 * @description Base error class for every `@stackra/notifications`
 *   error.
 *
 *   Every downstream error class extends this base and carries a
 *   `code` field consumers can pattern-match on with a discriminated
 *   union — the message is human-readable, the code is machine-
 *   readable.
 */

/**
 * Base error class for notifications errors.
 *
 * Extend this class for every new error to keep a single `instanceof`
 * check working across the whole package (`err instanceof NotificationError`).
 */
export abstract class NotificationError extends Error {
  /** Machine-readable code for pattern-matching. */
  public abstract readonly code: string;

  public constructor(message: string) {
    super(message);
    // Preserve the class name across V8's `toString()` — matches the
    // convention used across `@stackra/*` errors.
    this.name = new.target.name;
  }
}
