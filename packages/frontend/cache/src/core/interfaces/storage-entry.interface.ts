/**
 * @file storage-entry.interface.ts
 * @module @stackra/cache/core/interfaces
 * @description Internal serialized cache entry interface for the Web Storage store.
 *   Represents a single JSON-serialized value with creation time and TTL metadata.
 */

/**
 * Internal serialized cache entry stored in Web Storage.
 *
 * Represents the JSON structure persisted to localStorage/sessionStorage
 * for each cache entry. Includes creation timestamp for TTL computation
 * and the raw value to be deserialized on retrieval.
 */
export interface IStorageEntry {
  /** The cached value (JSON-serializable). */
  value: unknown;
  /** Unix timestamp (ms) when the entry was created. */
  createdAt: number;
  /** TTL in milliseconds. Undefined = never expires. */
  ttl?: number;
}
