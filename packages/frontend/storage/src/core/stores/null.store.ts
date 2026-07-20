/**
 * @file null.store.ts
 * @module @stackra/storage/core/stores
 * @description Cross-platform no-op `IStorage`. Every write is
 *   swallowed, every read returns `null`. Useful in unit tests
 *   that must not persist state and as a fail-soft fallback when
 *   the real backing driver is unavailable.
 */

import type { IStorage } from "@stackra/contracts";

/**
 * No-op `IStorage`.
 *
 * @example
 * ```typescript
 * const store = new NullStore();
 * await store.set('anything', 42);
 * await store.get('anything'); // null
 * ```
 */
export class NullStore implements IStorage {
  /** @inheritdoc */
  public async get<T>(_key: string): Promise<T | null> {
    return null;
  }

  /** @inheritdoc */
  public async set<T>(_key: string, _value: T): Promise<void> {
    // no-op — writes are intentionally dropped.
  }

  /** @inheritdoc */
  public async delete(_key: string): Promise<void> {
    // no-op — there is nothing to delete.
  }

  /** @inheritdoc */
  public async clear(): Promise<void> {
    // no-op — the store is already empty by definition.
  }

  /** @inheritdoc */
  public async has(_key: string): Promise<boolean> {
    return false;
  }

  /** @inheritdoc */
  public async keys(): Promise<string[]> {
    return [];
  }
}
