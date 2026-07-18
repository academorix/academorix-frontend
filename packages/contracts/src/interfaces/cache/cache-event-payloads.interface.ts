/**
 * @file cache-event-payloads.interface.ts
 * @module @stackra/contracts/interfaces/cache
 * @description Typed payload shapes for every constant in
 *   `CACHE_EVENTS`. Listeners bound via `@OnEvent(CACHE_EVENTS.HIT)`
 *   receive `ICacheHitPayload`, etc., so misspelled fields become
 *   compile-time errors.
 *
 *   Every payload extends {@link ICacheEventBase} which carries the
 *   store name — the two-tier cache manager may serve the same key
 *   from different stores, and audit consumers need to know which
 *   one delivered the event.
 */

/**
 * Common fields carried by every cache event payload.
 *
 * Every payload includes the resolving store name so subscribers
 * that only care about one tier (say, `redis`) can filter without
 * inspecting driver internals.
 */
export interface ICacheEventBase {
  /** Named store that produced the event (`'memory'`, `'redis'`, …). */
  readonly store: string;
}

/**
 * Payload for `CACHE_EVENTS.HIT` — the key was found in the store.
 */
export interface ICacheHitPayload extends ICacheEventBase {
  /** The lookup key that matched. */
  readonly key: string;
}

/**
 * Payload for `CACHE_EVENTS.MISS` — the key was absent or expired.
 */
export interface ICacheMissPayload extends ICacheEventBase {
  /** The lookup key that produced no value. */
  readonly key: string;
}

/**
 * Payload for `CACHE_EVENTS.WRITTEN` — a value was written to the
 * store via `set`, `put`, `add`, `forever`, or `setMany`.
 */
export interface ICacheWrittenPayload extends ICacheEventBase {
  /** The key that was written. */
  readonly key: string;
  /**
   * TTL applied at write time, in seconds. `undefined` when the
   * write is permanent (`forever` / `add` with no TTL).
   */
  readonly ttl?: number;
}

/**
 * Payload for `CACHE_EVENTS.FORGOTTEN` — a key was removed via
 * `delete`, `forget`, or `pull`.
 */
export interface ICacheForgottenPayload extends ICacheEventBase {
  /** The key that was removed. */
  readonly key: string;
}

/**
 * Payload for `CACHE_EVENTS.FLUSHED` — the entire store was cleared.
 */
export interface ICacheFlushedPayload extends ICacheEventBase {}

/**
 * Payload for `CACHE_EVENTS.INCREMENTED` — a numeric counter was
 * incremented.
 */
export interface ICacheIncrementedPayload extends ICacheEventBase {
  /** The counter key. */
  readonly key: string;
  /** The increment amount (default 1). */
  readonly by: number;
  /** The resulting counter value. */
  readonly value: number;
}

/**
 * Payload for `CACHE_EVENTS.DECREMENTED` — a numeric counter was
 * decremented. Structural mirror of {@link ICacheIncrementedPayload}.
 */
export interface ICacheDecrementedPayload extends ICacheEventBase {
  readonly key: string;
  readonly by: number;
  readonly value: number;
}

/**
 * Payload for `CACHE_EVENTS.TOUCHED` — the TTL of an existing key
 * was extended without altering the value.
 */
export interface ICacheTouchedPayload extends ICacheEventBase {
  readonly key: string;
  /** New TTL in seconds. */
  readonly ttl: number;
  /**
   * Whether the extension succeeded — `false` when the key was
   * absent or the driver doesn't support the operation.
   */
  readonly success: boolean;
}
