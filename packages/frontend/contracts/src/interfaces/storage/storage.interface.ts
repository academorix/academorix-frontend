/**
 * @file storage.interface.ts
 * @module @stackra/contracts/interfaces/storage
 * @description The `IStorage` KV contract — one shape every backing
 *   store (localStorage, sessionStorage, IndexedDB, AsyncStorage,
 *   memory) speaks.
 */

/**
 * Options passed to `IStorage.set()`.
 *
 * The family sits alongside `IStorage` because it is only ever
 * consumed by that interface's `set` method.
 */
export interface IStorageSetOptions {
  /**
   * Time-to-live in seconds. When omitted the entry never expires.
   *
   * @remarks Drivers that don't natively support TTL (localStorage,
   *   sessionStorage, AsyncStorage) wrap the value in an envelope
   *   `{ v, e? }` and expire it on read. IndexedDB stores the
   *   expiry alongside the value in the row.
   */
  readonly ttlSeconds?: number;
}

/**
 * Async KV storage contract.
 *
 * Promise-first for uniformity: sync backing stores (localStorage,
 * sessionStorage) wrap results in `Promise.resolve(...)`; async
 * ones (IndexedDB, AsyncStorage) return real promises. Consumers
 * never branch on backing store.
 *
 * Missing entries and expired entries both resolve to `null`
 * (matching `AsyncStorage.getItem`'s convention).
 *
 * @example
 * ```typescript
 * import { STORAGE, type IStorage } from '@stackra/contracts';
 *
 * class PreferencesService {
 *   public constructor(@Inject(STORAGE) private readonly storage: IStorage) {}
 *
 *   async loadTheme(): Promise<string> {
 *     return (await this.storage.get<string>('theme')) ?? 'light';
 *   }
 * }
 * ```
 */
export interface IStorage {
  /**
   * Read a value by key.
   *
   * @typeParam T - Expected value type after deserialisation.
   * @param key - The key to read.
   * @returns The stored value, or `null` when the key is missing or
   *   the entry has expired.
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Write a value.
   *
   * @typeParam T - The value type. Must be JSON-serialisable when the
   *   backing store serialises (localStorage, sessionStorage,
   *   AsyncStorage). Structured-clonable when the store uses
   *   structured clone (IndexedDB).
   * @param key - The key to write.
   * @param value - The value to persist.
   * @param options - Optional set options (`ttlSeconds`, …).
   */
  set<T>(key: string, value: T, options?: IStorageSetOptions): Promise<void>;

  /**
   * Delete a key.
   *
   * @param key - The key to remove. No-op when the key is absent.
   */
  delete(key: string): Promise<void>;

  /**
   * Remove every key owned by this instance.
   *
   * @remarks Only touches keys under this instance's prefix — other
   *   named `IStorage` instances sharing the same physical backing
   *   store are unaffected.
   */
  clear(): Promise<void>;

  /**
   * Whether a key exists (and is not expired).
   *
   * @param key - The key to check.
   * @returns `true` when the key exists AND has not expired.
   */
  has(key: string): Promise<boolean>;

  /**
   * List every key owned by this instance.
   *
   * @returns Every non-expired key currently persisted under this
   *   instance's prefix. Order is store-defined.
   */
  keys(): Promise<string[]>;
}
