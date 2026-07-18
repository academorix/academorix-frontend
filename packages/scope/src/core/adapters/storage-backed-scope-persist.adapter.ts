/**
 * @file storage-backed-scope-persist.adapter.ts
 * @module @stackra/scope/core/adapters
 * @description Cross-platform `IScopePersistAdapter` backed by
 *   `@stackra/storage`. Injects the app's `StorageManager` + the
 *   resolved `SCOPE_CONFIG` and reads / writes the active scope node
 *   id as a single key.
 *
 *   Replaces `AsyncStorageScopePersistAdapter` — one code path for
 *   web + native. The backing driver (localStorage / sessionStorage /
 *   IndexedDB / AsyncStorage / custom) is a config choice at the
 *   `StorageManager` level, not a compile-time choice.
 */

import { Inject, Injectable, Optional } from '@stackra/container';
import { STORAGE_MANAGER, type IStorage, type IStorageManager } from '@stackra/contracts';

import { SCOPE_CONFIG } from '@/core/constants';
import type { IScopeModuleOptions } from '@/core/interfaces';
import type { IScopePersistAdapter } from '@/core/interfaces/scope-persist-adapter.interface';

/** Default storage key — namespaced under `@stackra:scope`. */
const DEFAULT_STORAGE_KEY = '@stackra:scope:active_node_id';

/**
 * `IScopePersistAdapter` backed by `IStorage`.
 *
 * Bound in `ScopeModule.forRoot({ storage: '<instance>' })` under the
 * `SCOPE_PERSIST_ADAPTER` token. The scope module uses it to wrap the
 * app-provided data source via `withPersistAdapter`, so `setScope`
 * writes the active node id to the underlying `IStorage`.
 *
 * Every method is fail-soft — the adapter defers to `IStorage`'s
 * own fail-soft semantics (`get` returns `null` on error, `set` /
 * `delete` swallow errors).
 *
 * @example
 * ```typescript
 * @Module({
 *   imports: [
 *     WebStorageModule.forRoot({
 *       default: 'localStorage',
 *       stores: { localStorage: { driver: 'localStorage', prefix: 'app' } },
 *     }),
 *     ScopeModule.forRoot({
 *       dataSource: new HttpScopeDataSource(api),
 *       storage: 'localStorage',
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Injectable()
export class StorageBackedScopePersistAdapter implements IScopePersistAdapter {
  /** Storage key inside the resolved `IStorage`. */
  private readonly storageKey: string;

  /** Named `IStorage` instance to resolve from the manager. */
  private readonly instanceName: string;

  /** Lazy — resolved on first access. */
  private cached: IStorage | null = null;

  /**
   * @param manager - The resolved `IStorageManager` (from
   *   `WebStorageModule` / `NativeStorageModule`).
   * @param config - The merged scope config; the adapter reads
   *   `storage` (instance name) and `storageKey` (key inside the
   *   instance) from it.
   */
  public constructor(
    @Inject(STORAGE_MANAGER) private readonly manager: IStorageManager,
    @Optional() @Inject(SCOPE_CONFIG) config?: IScopeModuleOptions
  ) {
    this.instanceName = config?.storage ?? '';
    this.storageKey = config?.storageKey ?? DEFAULT_STORAGE_KEY;
  }

  /** @inheritdoc */
  public async persist(nodeId: string): Promise<void> {
    await this.storage().set(this.storageKey, nodeId);
  }

  /** @inheritdoc */
  public async restore(): Promise<string | null> {
    const value = await this.storage().get<string>(this.storageKey);
    // Treat empty strings as "no selection" — matches the AsyncStorage
    // adapter this class replaces and the null convention the rest of
    // the scope runtime uses.
    return value && value.length > 0 ? value : null;
  }

  /** @inheritdoc */
  public async clear(): Promise<void> {
    await this.storage().delete(this.storageKey);
  }

  /**
   * Resolve (and cache) the underlying `IStorage`. Deferred so
   * platform modules that register drivers via `manager.extend(...)`
   * during `onApplicationBootstrap` get a chance to run first.
   *
   * When `instanceName` is empty (caller omitted `storage`), the
   * manager's default instance is returned.
   */
  private storage(): IStorage {
    if (this.cached) return this.cached;
    this.cached = this.instanceName
      ? this.manager.instance(this.instanceName)
      : this.manager.instance();
    return this.cached;
  }
}
