/**
 * @file memory.store.ts
 * @module @stackra/storage/core/stores
 * @description Cross-platform in-memory `IStorage`. Backed by a
 *   plain `Map<string, TtlEnvelope>`. Contents disappear when the
 *   process (or tab) exits — useful as the default fallback in
 *   tests, SSR, and when persistence is intentionally undesirable.
 */

import type { IStorage, IStorageSetOptions } from "@stackra/contracts";

import { wrapTtl, unwrapTtl, type TtlEnvelope } from "@/core/utils/ttl-envelope.util";

/**
 * In-process `IStorage` implementation.
 *
 * Not shared across instances — every `new MemoryStore()` holds its
 * own `Map`. The optional `prefix` config field is accepted for API
 * uniformity with the persistent stores but is effectively a no-op
 * here (each memory store is already isolated).
 *
 * @example
 * ```typescript
 * const store = new MemoryStore();
 * await store.set('theme', 'dark', { ttlSeconds: 60 });
 * await store.get<string>('theme'); // 'dark'
 * ```
 */
export class MemoryStore implements IStorage {
  /** The in-process backing map. */
  private readonly map = new Map<string, TtlEnvelope<unknown>>();

  /** @inheritdoc */
  public async get<T>(key: string): Promise<T | null> {
    const envelope = this.map.get(key);
    if (envelope === undefined) return null;

    const value = unwrapTtl<T>(envelope);
    if (value === null) {
      // Passive expiration: drop the row on read so `keys()` and
      // `has()` don't leak expired entries.
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
    const envelope = this.map.get(key);
    if (envelope === undefined) return false;
    // Trigger the same passive-expiration path as `get` so `has`
    // and `get` agree on liveness.
    return (await this.get(key)) !== null;
  }

  /** @inheritdoc */
  public async keys(): Promise<string[]> {
    // Iterate once, evicting expired rows as we go so callers get
    // an accurate live-key list.
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
