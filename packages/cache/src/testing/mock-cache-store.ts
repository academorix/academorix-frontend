/**
 * @file mock-cache-store.ts
 * @module @stackra/cache/testing
 * @description In-memory `ICacheStore` implementation for tests.
 *
 *   Backed by a plain `Map` with optional TTL tracking. Every method on
 *   the `ICacheStore` contract is implemented, so mocks are safe to pass
 *   anywhere a real store is expected.
 */

import type { ICacheStore } from "@stackra/contracts";

/** Internal entry — value + optional expiry timestamp (ms since epoch). */
interface StoreEntry {
  value: unknown;
  expiresAt?: number;
}

/**
 * In-memory cache store for testing.
 *
 * Mirrors every method in `ICacheStore` (including the optional ones)
 * with working in-memory behaviour, so consumers can point their code
 * at this store with zero adaptation.
 */
export class MockCacheStore implements Required<ICacheStore> {
  private readonly store = new Map<string, StoreEntry>();

  public async get<T = unknown>(key: string): Promise<T | undefined> {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt !== undefined && entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value as T;
  }

  public async set<T = unknown>(key: string, value: T, ttl?: number): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: ttl !== undefined ? Date.now() + ttl * 1000 : undefined,
    });
  }

  public async has(key: string): Promise<boolean> {
    return (await this.get(key)) !== undefined;
  }

  public async forget(key: string): Promise<boolean> {
    return this.store.delete(key);
  }

  public async delete(key: string): Promise<boolean> {
    return this.forget(key);
  }

  public async flush(): Promise<void> {
    this.store.clear();
  }

  public async clear(): Promise<void> {
    return this.flush();
  }

  public async many<T = unknown>(keys: string[]): Promise<Map<string, T | undefined>> {
    const result = new Map<string, T | undefined>();
    for (const key of keys) {
      result.set(key, await this.get<T>(key));
    }
    return result;
  }

  public async putMany<T = unknown>(entries: Map<string, T>, ttl?: number): Promise<void> {
    for (const [key, value] of entries) {
      await this.set(key, value, ttl);
    }
  }

  public async setMany<T = unknown>(entries: Map<string, T>, ttl?: number): Promise<void> {
    return this.putMany(entries, ttl);
  }

  public async forever<T = unknown>(key: string, value: T): Promise<void> {
    return this.set(key, value);
  }

  public async touch(key: string, ttl: number): Promise<boolean> {
    const entry = this.store.get(key);
    if (!entry) return false;
    entry.expiresAt = Date.now() + ttl * 1000;
    return true;
  }

  public async increment(key: string, value: number = 1): Promise<number> {
    const current = ((await this.get<number>(key)) ?? 0) as number;
    const next = current + value;
    await this.set(key, next);
    return next;
  }

  public async decrement(key: string, value: number = 1): Promise<number> {
    return this.increment(key, -value);
  }
}
