/**
 * @file cache-entry.interface.ts
 * @module @stackra/cache/core/interfaces
 * @description Internal cache entry interface for the in-memory store.
 *   Represents a single cached value with its expiry metadata.
 */

/**
 * Internal cache entry with value and optional expiry timestamp.
 *
 * Used by the MemoryStore to track cached values alongside their
 * expiration metadata for passive TTL expiry on read access.
 */
export interface ICacheEntry<T = unknown> {
  /** The cached value. */
  value: T;
  /** Unix timestamp (ms) when this entry expires, or null for no expiry. */
  expiresAt: number | null;
}
