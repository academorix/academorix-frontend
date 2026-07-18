/**
 * @file state-storage.interface.ts
 * @module @stackra/contracts/interfaces/state
 * @description Storage-backend contract for persisting reactive store state.
 *
 *   Implemented by `@stackra/state` adapters (localStorage, sessionStorage)
 *   and pluggable backends (IndexedDB, remote KV). Lives in contracts so
 *   consumers can provide custom storage without depending on the runtime.
 */

/**
 * Key→value storage backend for persisted store state.
 *
 * Synchronous methods back the common browser-storage case; `getAsync`
 * exists for adapters that require async access (IndexedDB, remote KV).
 */
export interface IStateStorage {
  /**
   * Synchronously retrieve a value.
   *
   * @typeParam T - The expected value type.
   * @param key - The store name (adapters add their own prefix).
   * @returns The deserialized value, or `null` when absent or unparseable.
   */
  get<T>(key: string): T | null;

  /**
   * Asynchronously retrieve a value.
   *
   * @typeParam T - The expected value type.
   * @param key - The store name (adapters add their own prefix).
   * @returns A promise resolving to the value, or `null`.
   */
  getAsync<T>(key: string): Promise<T | null>;

  /**
   * Persist a value.
   *
   * @typeParam T - The value type.
   * @param key - The store name (adapters add their own prefix).
   * @param value - The value to serialize and persist.
   */
  set<T>(key: string, value: T): void;

  /**
   * Remove a single key.
   *
   * @param key - The store name (adapters add their own prefix).
   */
  remove(key: string): void;

  /** Clear every state-owned key from the backend. */
  clear(): void;
}
