/**
 * @file cache-store.interface.ts
 * @module @stackra/contracts/interfaces/cache
 * @description Cache store driver contract.
 */

/**
 * Cache store driver contract.
 *
 * Implemented by memory, Redis, storage, and null stores.
 */
export interface ICacheStore {
  /** Get a value by key. Returns undefined on miss. */
  get<T = unknown>(key: string): Promise<T | undefined>;

  /** Set a value with optional TTL in seconds. */
  set<T = unknown>(key: string, value: T, ttl?: number): Promise<void>;

  /** Check if a key exists. */
  has(key: string): Promise<boolean>;

  /** Remove a key. Returns true if the key existed. */
  forget?(key: string): Promise<boolean>;

  /** Remove a key (alias for forget). Returns true if the key existed. */
  delete?(key: string): Promise<boolean>;

  /** Remove all keys (flush the store). */
  flush?(): Promise<void>;

  /** Remove all keys (alias for flush). */
  clear?(): Promise<void>;

  /** Get multiple keys at once. */
  many?<T = unknown>(keys: string[]): Promise<Map<string, T | undefined>>;

  /** Set multiple keys at once. */
  putMany?<T = unknown>(entries: Map<string, T>, ttl?: number): Promise<void>;

  /** Set multiple keys at once (alias for putMany). */
  setMany?<T = unknown>(entries: Map<string, T>, ttl?: number): Promise<void>;

  /** Store a value indefinitely (no TTL). */
  forever?<T = unknown>(key: string, value: T): Promise<void>;

  /** Extend the TTL of an existing key. */
  touch?(key: string, ttl: number): Promise<boolean>;

  /** Increment a numeric value. Returns new value. */
  increment?(key: string, value?: number): Promise<number>;

  /** Decrement a numeric value. Returns new value. */
  decrement?(key: string, value?: number): Promise<number>;
}
