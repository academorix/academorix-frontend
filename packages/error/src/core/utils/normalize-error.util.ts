/**
 * @file normalize-error.util.ts
 * @module @stackra/error/core/utils
 * @description Coerce any thrown value into a real `Error` instance.
 */

/**
 * Coerce an arbitrary thrown value into an `Error`.
 *
 * JavaScript lets code `throw` anything — strings, numbers, plain
 * objects, `undefined`. Boundaries and reporters need a stable `Error`
 * shape, so this normalises whatever was thrown:
 *
 * - `Error` instances pass through untouched.
 * - Strings become the error message.
 * - Everything else is best-effort JSON-stringified into the message,
 *   falling back to `String(value)` if that throws (e.g. circular refs).
 *
 * @param value - The value that was thrown.
 * @returns A guaranteed `Error` instance.
 */
export function normalizeError(value: unknown): Error {
  if (value instanceof Error) {
    return value;
  }

  if (typeof value === "string") {
    return new Error(value);
  }

  try {
    return new Error(JSON.stringify(value));
  } catch {
    return new Error(String(value));
  }
}
