/**
 * @file serialized-error.type.ts
 * @module @stackra/error/core/types
 * @description Plain, JSON-safe representation of an Error.
 */

/**
 * A structured, serialisable snapshot of an `Error`.
 *
 * Safe to send across a wire (SSR → client hydration, log transports,
 * telemetry) where the live `Error` instance and its prototype chain
 * can't survive.
 */
export interface SerializedError {
  /** The error constructor name (e.g. `TypeError`). */
  name: string;

  /** The human-readable error message. */
  message: string;

  /** The captured stack trace, when available. */
  stack?: string;

  /** The recursively serialised `cause`, when present. */
  cause?: SerializedError;
}
