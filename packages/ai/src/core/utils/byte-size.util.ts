/**
 * @file byte-size.util.ts
 * @module @stackra/ai/core/utils
 * @description Serialized byte-size measurement for context frames and
 *   snapshots. Used by the `ContextCollector` to enforce configurable
 *   per-frame and aggregate size caps.
 */

/** Shared UTF-8 encoder (available in browsers and Node >= 22). */
const encoder = new TextEncoder();

/**
 * Compute the UTF-8 byte length of a value's JSON serialization.
 *
 * `JSON.stringify` may return `undefined` for values that are not
 * serializable (e.g. a bare `undefined` or a function) — those are treated
 * as zero bytes.
 *
 * @param value - Any JSON-serializable value.
 * @returns The number of UTF-8 bytes in `JSON.stringify(value)`.
 */
export function serializedSizeOf(value: unknown): number {
  const json = JSON.stringify(value);
  if (json === undefined) {
    return 0;
  }
  return encoder.encode(json).byteLength;
}
