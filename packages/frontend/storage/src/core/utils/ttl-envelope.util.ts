/**
 * @file ttl-envelope.util.ts
 * @module @stackra/storage/core/utils
 * @description Envelope helpers for stores that must implement TTL
 *   without native support (`localStorage`, `sessionStorage`,
 *   `AsyncStorage`, `IndexedDB`). The envelope adds one extra
 *   millisecond timestamp field so we know when to expire on read.
 */

/**
 * Serialisable envelope wrapping a stored value.
 *
 * The shape uses short field names (`v`, `e`) because it is
 * JSON-serialised into every persisted value — a savings of a few
 * bytes per row that adds up across thousands of entries.
 */
export interface TtlEnvelope<T> {
  /** The payload value. */
  readonly v: T;
  /**
   * Unix epoch millisecond at which the entry expires. Omitted when
   * no TTL was set (entry never expires).
   */
  readonly e?: number;
}

/**
 * Wrap a value into a TTL envelope.
 *
 * @typeParam T - The payload type.
 * @param value - The value to wrap.
 * @param ttlSeconds - Optional TTL in seconds; when omitted no
 *   `e` field is written.
 * @returns The envelope, ready to be JSON-serialised.
 */
export function wrapTtl<T>(value: T, ttlSeconds?: number): TtlEnvelope<T> {
  if (ttlSeconds === undefined || ttlSeconds <= 0) {
    return { v: value };
  }
  return { v: value, e: Date.now() + ttlSeconds * 1000 };
}

/**
 * Unwrap a TTL envelope. Returns the payload when still fresh,
 * `null` when expired or when the input isn't an envelope at all.
 *
 * @typeParam T - The payload type.
 * @param raw - The parsed value read from a backing store. May be an
 *   envelope, a raw value from a pre-envelope version, or `null`.
 * @returns The payload when fresh, or `null` when expired / absent.
 */
export function unwrapTtl<T>(raw: unknown): T | null {
  if (raw === null || raw === undefined) return null;

  // Duck-type an envelope: an object literal with a `v` field and,
  // when present, a numeric `e` field. Everything else is treated
  // as a raw pre-envelope value and passed through.
  if (typeof raw !== 'object' || Array.isArray(raw) || !('v' in raw)) {
    return raw as T;
  }

  const envelope = raw as TtlEnvelope<T>;
  if (envelope.e !== undefined && envelope.e <= Date.now()) {
    // Expired — the store's read path should also delete the row.
    return null;
  }
  return envelope.v;
}

/**
 * Whether a TTL envelope is expired at the current wall-clock time.
 *
 * @param envelope - The envelope to inspect (or `null`).
 * @returns `true` when the envelope has an `e` in the past.
 */
export function isExpired(envelope: TtlEnvelope<unknown> | null): boolean {
  if (envelope === null || envelope.e === undefined) return false;
  return envelope.e <= Date.now();
}
