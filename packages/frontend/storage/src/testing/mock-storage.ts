/**
 * @file mock-storage.ts
 * @module @stackra/storage/testing
 * @description In-memory `IStorage` implementation for tests.
 *
 *   Behaviourally identical to `MemoryStore` — pulled out here so the
 *   name matches the workspace's testing-package convention
 *   (`Mock*` classes live in `./testing`).
 */

import type { IStorage, IStorageSetOptions } from "@stackra/contracts";

import { unwrapTtl, wrapTtl, type TtlEnvelope } from "@/core/utils/ttl-envelope.util";

/**
 * In-memory `IStorage` implementation.
 *
 * Every write is stored in a plain `Map` alongside its TTL envelope;
 * every read passively expires stale rows. Contents disappear when
 * the process exits — the store never touches a real backing driver.
 *
 * @example
 * ```typescript
 * import { MockStorage } from '@stackra/storage/testing';
 *
 * const store = new MockStorage();
 * await store.set('theme', 'dark');
 * expect(await store.get<string>('theme')).toBe('dark');
 * ```
 */
export class MockStorage implements IStorage {
  /** Internal backing map. Public for direct test assertions. */
  public readonly map = new Map<string, TtlEnvelope<unknown>>();

  /** @inheritdoc */
  public async get<T>(key: string): Promise<T | null> {
    const envelope = this.map.get(key);
    if (envelope === undefined) return null;

    const value = unwrapTtl<T>(envelope);
    if (value === null) {
      this.map.delete(key);
    }
    return value;
  }

  /** @inheritdoc */
  public async set<T>(key: string, value: T, options?: IStorageSetOptions): Promise<void> {
    this.map.set(key, wrapTtl(value, options?.ttlSeconds));
  }

  /** @inheritdoc */
  public async delete(key: string): Promise<void> {
    this.map.delete(key);
  }

  /** @inheritdoc */
  public async clear(): Promise<void> {
    this.map.clear();
  }

  /** @inheritdoc */
  public async has(key: string): Promise<boolean> {
    return (await this.get(key)) !== null;
  }

  /** @inheritdoc */
  public async keys(): Promise<string[]> {
    const live: string[] = [];
    for (const [key, envelope] of this.map.entries()) {
      if (unwrapTtl(envelope) === null) {
        this.map.delete(key);
        continue;
      }
      live.push(key);
    }
    return live;
  }
}
