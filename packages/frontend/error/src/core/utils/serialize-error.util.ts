/**
 * @file serialize-error.util.ts
 * @module @stackra/error/core/utils
 * @description Convert an Error into a JSON-safe SerializedError.
 */

import type { SerializedError } from "../types/serialized-error.type";
import { normalizeError } from "./normalize-error.util";

/**
 * Convert any thrown value into a JSON-safe {@link SerializedError}.
 *
 * The value is first normalised to an `Error`, then flattened into a
 * plain object. A nested `cause` (ES2022 error chaining) is serialised
 * recursively so the whole chain survives transport.
 *
 * @param value - The value that was thrown.
 * @returns A plain, serialisable error snapshot.
 */
export function serializeError(value: unknown): SerializedError {
  const error = normalizeError(value);

  const serialized: SerializedError = {
    name: error.name,
    message: error.message,
    stack: error.stack,
  };

  if (error.cause !== undefined && error.cause !== null) {
    serialized.cause = serializeError(error.cause);
  }

  return serialized;
}
