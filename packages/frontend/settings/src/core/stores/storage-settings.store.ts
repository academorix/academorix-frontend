/**
 * @file storage-settings.store.ts
 * @module @stackra/settings/core/stores
 * @description Settings store backed by a named `IStorage` instance
 *   from `@stackra/storage`. Works across every storage driver the
 *   storage package ships (memory, localStorage, sessionStorage,
 *   IndexedDB, AsyncStorage) without duplicating any of their code.
 *
 *   The store composes over `IStorage` — it never touches
 *   `localStorage` / `window` / `AsyncStorage` directly. All
 *   fail-soft semantics, TTL envelopes, and cross-platform
 *   normalisation live in `@stackra/storage`.
 */

import { Str } from "@stackra/support";
import type { IStorage, IStorageManager, ISettingsStore } from "@stackra/contracts";

/**
 * Options accepted by `StorageSettingsStore`.
 */
export interface IStorageSettingsStoreOptions {
  /**
   * The `IStorage` instance backing this store. Callers who want to
   * defer resolution can pass an `IStorageManager` + `instanceName`
   * pair instead.
   */
  readonly storage?: IStorage;

  /**
   * Manager to resolve the backing instance from. Ignored when
   * `storage` is provided.
   */
  readonly manager?: IStorageManager;

  /**
   * Name of the `IStorage` instance in `STORAGE_MANAGER` to proxy
   * to. Ignored when `storage` is provided directly.
   */
  readonly instanceName?: string;

  /**
   * Optional prefix appended to every group key before writing.
   * Useful when two settings stores share the same `IStorage`
   * backing.
   */
  readonly prefix?: string;
}

/**
 * `ISettingsStore` composed over a named `IStorage` instance.
 *
 * @example
 * ```typescript
 * const storage = manager.instance('localStorage');
 * const store = new StorageSettingsStore({ storage, prefix: 'stackra:settings' });
 * await store.save('display', { compact: true });
 * ```
 */
export class StorageSettingsStore implements ISettingsStore {
  /** Driver identifier. */
  public readonly driver = "storage";

  /** Resolved backing storage instance. */
  private readonly resolvedStorage: IStorage;

  /** Optional key prefix. Trailing colon added automatically. */
  private readonly prefix: string;

  /**
   * @param options - Storage store options.
   */
  public constructor(options: IStorageSettingsStoreOptions) {
    if (options.storage) {
      this.resolvedStorage = options.storage;
    } else if (options.manager) {
      this.resolvedStorage = options.manager.instance(options.instanceName);
    } else {
      throw new Error("[StorageSettingsStore] Either `storage` or `manager` must be provided.");
    }

    // Normalise the prefix — ensure a trailing colon so builders
    // don't need to think about it.
    if (options.prefix && options.prefix.length > 0) {
      this.prefix = Str.endsWith(options.prefix, ":") ? options.prefix : `${options.prefix}:`;
    } else {
      this.prefix = "";
    }
  }

  /** @inheritDoc */
  public async load(groupKey: string): Promise<Record<string, unknown>> {
    const raw = await this.resolvedStorage.get<Record<string, unknown>>(this.key(groupKey));
    return raw ?? {};
  }

  /** @inheritDoc */
  public async save(groupKey: string, values: Record<string, unknown>): Promise<void> {
    await this.resolvedStorage.set(this.key(groupKey), values);
  }

  /** @inheritDoc */
  public async clear(groupKey: string): Promise<void> {
    await this.resolvedStorage.delete(this.key(groupKey));
  }

  /**
   * @inheritDoc
   *
   * @remarks Walks every key under the configured prefix, strips
   *   the prefix to recover the group key, and reads the value.
   *   Runs in parallel via `Promise.all` — safe because
   *   `IStorage.get` is idempotent.
   */
  public async loadAll(): Promise<Record<string, Record<string, unknown>>> {
    const allKeys = await this.resolvedStorage.keys();
    // Filter to keys we own (matching the configured prefix) — a
    // shared IStorage may hold entries from other stores.
    const owned = this.prefix ? allKeys.filter((k) => k.startsWith(this.prefix)) : allKeys;

    const entries = await Promise.all(
      owned.map(async (fullKey) => {
        const groupKey = this.prefix ? fullKey.slice(this.prefix.length) : fullKey;
        const values = await this.resolvedStorage.get<Record<string, unknown>>(fullKey);
        return [groupKey, values ?? {}] as const;
      }),
    );

    const out: Record<string, Record<string, unknown>> = {};
    for (const [groupKey, values] of entries) {
      out[groupKey] = values;
    }
    return out;
  }

  /** Build the full storage key (prefix + group). */
  private key(groupKey: string): string {
    return `${this.prefix}${groupKey}`;
  }
}
