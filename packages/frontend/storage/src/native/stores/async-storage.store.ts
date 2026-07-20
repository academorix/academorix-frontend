/**
 * @file async-storage.store.ts
 * @module @stackra/storage/native/stores
 * @description `IStorage` backed by `@react-native-async-storage/
 *   async-storage` — the React Native default persistent KV store.
 *
 *   AsyncStorage's API is JSON-string-only + fully async, so this
 *   driver serialises values via the shared TTL envelope helper and
 *   prefixes keys for multi-instance safety, exactly like the DOM
 *   Storage drivers.
 */

import type { IStorage, IStorageSetOptions } from "@stackra/contracts";

import { prefixKey, stripPrefix } from "@/core/utils/prefix-key.util";
import { unwrapTtl, wrapTtl } from "@/core/utils/ttl-envelope.util";

/**
 * Constructor config accepted by `AsyncStorageStore`.
 */
export interface AsyncStorageStoreConfig {
  /**
   * Key prefix applied to every write. Defaults to `''`. Callers
   * usually supply the instance name so multiple `IStorage`
   * instances backed by the same AsyncStorage coexist.
   */
  readonly prefix?: string;
}

/**
 * Minimal typing of the subset of `@react-native-async-storage/
 * async-storage` this driver uses. Kept internal so we don't drag
 * the whole package's types into the type surface — the peer is
 * optional and its `.d.ts` may not be present.
 */
interface AsyncStorageLike {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  getAllKeys(): Promise<readonly string[]>;
  multiRemove(keys: readonly string[]): Promise<void>;
}

/**
 * `IStorage` implementation persisting to React Native's
 * `AsyncStorage`.
 *
 * The AsyncStorage module is imported lazily via a dynamic
 * `import('@react-native-async-storage/async-storage')` on the
 * first operation — so this file is import-safe when the peer isn't
 * installed. Any read/write call throws with an actionable error
 * message when the peer is missing at runtime.
 *
 * @example
 * ```typescript
 * // Registered by NativeStorageModule when the caller declares an
 * // instance with driver: 'asyncStorage':
 * NativeStorageModule.forRoot({
 *   default: 'preferences',
 *   stores: { preferences: { driver: 'asyncStorage', prefix: 'app:prefs' } },
 * });
 * ```
 */
export class AsyncStorageStore implements IStorage {
  private readonly prefix: string;

  /** Lazy — resolved on first operation. */
  private ready: Promise<AsyncStorageLike> | null = null;

  /**
   * @param config - Optional prefix override.
   */
  public constructor(config: AsyncStorageStoreConfig = {}) {
    this.prefix = config.prefix ?? "";
  }

  // ── IStorage ─────────────────────────────────────────────────────

  /** @inheritdoc */
  public async get<T>(key: string): Promise<T | null> {
    try {
      const backing = await this.backing();
      const raw = await backing.getItem(prefixKey(this.prefix, key));
      if (raw === null) return null;
      const parsed = JSON.parse(raw) as unknown;
      const value = unwrapTtl<T>(parsed);
      if (value === null) {
        // Passive expiration: drop the row on read.
        await backing.removeItem(prefixKey(this.prefix, key));
      }
      return value;
    } catch {
      // fail-soft — corrupt JSON or transport error.
      return null;
    }
  }

  /** @inheritdoc */
  public async set<T>(key: string, value: T, options?: IStorageSetOptions): Promise<void> {
    try {
      const backing = await this.backing();
      const envelope = wrapTtl(value, options?.ttlSeconds);
      await backing.setItem(prefixKey(this.prefix, key), JSON.stringify(envelope));
    } catch {
      // fail-soft — quota / disk-full / transport error.
    }
  }

  /** @inheritdoc */
  public async delete(key: string): Promise<void> {
    try {
      const backing = await this.backing();
      await backing.removeItem(prefixKey(this.prefix, key));
    } catch {
      // fail-soft.
    }
  }

  /** @inheritdoc */
  public async clear(): Promise<void> {
    try {
      const backing = await this.backing();
      const all = await backing.getAllKeys();
      // Only remove keys under this instance's prefix — other named
      // instances on the same AsyncStorage stay intact.
      const owned = all.filter((raw) => stripPrefix(this.prefix, raw) !== null);
      if (owned.length > 0) await backing.multiRemove(owned);
    } catch {
      // fail-soft.
    }
  }

  /** @inheritdoc */
  public async has(key: string): Promise<boolean> {
    // Delegate to `get` so expired entries return false, matching
    // the contract's "expired = not there" semantics.
    return (await this.get(key)) !== null;
  }

  /** @inheritdoc */
  public async keys(): Promise<string[]> {
    try {
      const backing = await this.backing();
      const all = await backing.getAllKeys();

      // First filter: only rows under this instance's prefix.
      const owned = all.filter((raw) => stripPrefix(this.prefix, raw) !== null);

      // Second pass: strip expired rows. We batch the getItem calls
      // via Promise.all because AsyncStorage's per-call overhead is
      // real (each is a bridge crossing).
      const rows = await Promise.all(
        owned.map(async (raw) => {
          try {
            const value = await backing.getItem(raw);
            if (value === null) return { raw, expired: true as const };
            const parsed = JSON.parse(value) as unknown;
            return { raw, expired: unwrapTtl(parsed) === null };
          } catch {
            return { raw, expired: true as const };
          }
        }),
      );

      const expired = rows.filter((r) => r.expired).map((r) => r.raw);
      if (expired.length > 0) await backing.multiRemove(expired);

      return rows
        .filter((r) => !r.expired)
        .map((r) => stripPrefix(this.prefix, r.raw))
        .filter((k): k is string => k !== null);
    } catch {
      // fail-soft.
      return [];
    }
  }

  // ── Internal ─────────────────────────────────────────────────────

  /**
   * Resolve (and cache) the AsyncStorage module. This is the one
   * place the peer is required at runtime — consumers who never
   * construct an `AsyncStorageStore` never load it.
   */
  private backing(): Promise<AsyncStorageLike> {
    if (this.ready) return this.ready;

    this.ready = (async () => {
      let mod: { default: AsyncStorageLike } | AsyncStorageLike;
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mod = (await import(/* @vite-ignore */ "@react-native-async-storage/async-storage")) as any;
      } catch (cause) {
        throw new Error(
          "[@stackra/storage] AsyncStorageStore requires the " +
            "`@react-native-async-storage/async-storage` peer. " +
            "Install it with `pnpm add @react-native-async-storage/async-storage`.",
          { cause: cause as Error },
        );
      }

      // Handle both ESM default and CJS module.exports shapes.
      const resolved =
        typeof (mod as { default?: unknown }).default === "object"
          ? (mod as { default: AsyncStorageLike }).default
          : (mod as AsyncStorageLike);
      return resolved;
    })();

    return this.ready;
  }
}
