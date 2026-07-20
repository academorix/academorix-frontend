/**
 * @file web-storage-base.store.ts
 * @module @stackra/storage/react/stores
 * @description Abstract base for the two DOM `Storage`-backed
 *   drivers (`LocalStorageStore`, `SessionStorageStore`). Every
 *   piece of behaviour except the backing store itself lives here.
 */

import type { IStorage, IStorageSetOptions } from '@stackra/contracts';

import { prefixKey, stripPrefix } from '@/core/utils/prefix-key.util';
import { unwrapTtl, wrapTtl } from '@/core/utils/ttl-envelope.util';

/**
 * Constructor config accepted by every DOM-`Storage` driver.
 */
export interface WebStorageBaseConfig {
  /**
   * Key prefix applied to every write. Defaults to the instance name
   * so multiple `IStorage` instances backed by the same browser
   * storage coexist without collision.
   */
  readonly prefix?: string;
}

/**
 * Abstract `IStorage` implementation for the two DOM `Storage`
 * backends (`window.localStorage`, `window.sessionStorage`). The
 * subclass supplies the backing store via {@link getBackingStore}.
 *
 * Behaviour:
 *
 * - JSON-serialises values on write, wrapping them in a TTL envelope
 *   when the caller passes `ttlSeconds`.
 * - Passively expires entries on read (an expired row is deleted
 *   from the backing store the next time it's read).
 * - Prefixes every key so several `IStorage` instances share the
 *   same `Storage` object without stepping on each other.
 * - Fails soft when the backing store is unavailable (quota exceeded,
 *   private-mode, SSR) — writes are dropped, reads return `null`.
 *
 * @example
 * ```typescript
 * export class LocalStorageStore extends WebStorageBase {
 *   protected getBackingStore(): Storage | null {
 *     return typeof window === 'undefined' ? null : window.localStorage;
 *   }
 * }
 * ```
 */
export abstract class WebStorageBase implements IStorage {
  /** Effective prefix used for every key. */
  protected readonly prefix: string;

  /**
   * @param config - Driver config; `prefix` is optional and falls
   *   back to `''` (no prefix). Callers usually supply the instance
   *   name so keys are namespaced.
   */
  public constructor(config: WebStorageBaseConfig = {}) {
    this.prefix = config.prefix ?? '';
  }

  /**
   * Subclass hook returning the backing `Storage` object.
   *
   * @returns The DOM `Storage` (localStorage / sessionStorage), or
   *   `null` when it is unavailable in this environment (SSR,
   *   private-mode, feature-detected failure). When `null`, this
   *   store degrades into a no-op.
   */
  protected abstract getBackingStore(): Storage | null;

  /** @inheritdoc */
  public async get<T>(key: string): Promise<T | null> {
    const storage = this.getBackingStore();
    if (!storage) return null;

    try {
      const raw = storage.getItem(prefixKey(this.prefix, key));
      if (raw === null) return null;
      const parsed = JSON.parse(raw) as unknown;
      const value = unwrapTtl<T>(parsed);
      if (value === null) {
        // Passive expiration: drop the row so it doesn't show up in
        // `keys()` / `has()` and doesn't accumulate quota.
        storage.removeItem(prefixKey(this.prefix, key));
      }
      return value;
    } catch {
      // fail-soft — corrupt JSON, quota errors, or private-mode
      // reads all resolve to null so consumers never crash on read.
      return null;
    }
  }

  /** @inheritdoc */
  public async set<T>(key: string, value: T, options?: IStorageSetOptions): Promise<void> {
    const storage = this.getBackingStore();
    if (!storage) return;

    try {
      const envelope = wrapTtl(value, options?.ttlSeconds);
      storage.setItem(prefixKey(this.prefix, key), JSON.stringify(envelope));
    } catch {
      // fail-soft — quota exceeded / SecurityError swallowed so
      // caller code never has to try/catch every write.
    }
  }

  /** @inheritdoc */
  public async delete(key: string): Promise<void> {
    const storage = this.getBackingStore();
    if (!storage) return;

    try {
      storage.removeItem(prefixKey(this.prefix, key));
    } catch {
      // fail-soft — same reason as `set`.
    }
  }

  /** @inheritdoc */
  public async clear(): Promise<void> {
    const storage = this.getBackingStore();
    if (!storage) return;

    try {
      // Only remove keys under this instance's prefix — other named
      // instances sharing the same DOM Storage stay intact.
      const owned: string[] = [];
      for (let i = 0; i < storage.length; i += 1) {
        const rawKey = storage.key(i);
        if (rawKey === null) continue;
        if (stripPrefix(this.prefix, rawKey) !== null) owned.push(rawKey);
      }
      for (const rawKey of owned) storage.removeItem(rawKey);
    } catch {
      // fail-soft.
    }
  }

  /** @inheritdoc */
  public async has(key: string): Promise<boolean> {
    // Delegate to `get` so expired entries return `false` (matching
    // the contract's "expired = not there" semantics).
    return (await this.get(key)) !== null;
  }

  /** @inheritdoc */
  public async keys(): Promise<string[]> {
    const storage = this.getBackingStore();
    if (!storage) return [];

    try {
      const live: string[] = [];
      for (let i = 0; i < storage.length; i += 1) {
        const rawKey = storage.key(i);
        if (rawKey === null) continue;
        const userKey = stripPrefix(this.prefix, rawKey);
        if (userKey === null) continue;

        // Check freshness so expired entries don't leak.
        try {
          const raw = storage.getItem(rawKey);
          if (raw === null) continue;
          if (unwrapTtl(JSON.parse(raw) as unknown) === null) {
            storage.removeItem(rawKey);
            continue;
          }
        } catch {
          // Skip corrupt row.
          continue;
        }
        live.push(userKey);
      }
      return live;
    } catch {
      // fail-soft.
      return [];
    }
  }
}
