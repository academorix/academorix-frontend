/**
 * @file settings-manager.service.ts
 * @module @stackra/settings/core/services
 * @description Multi-instance manager over `ISettingsStore` drivers.
 *
 *   Extends `MultipleInstanceManager` from `@stackra/support` for the
 *   same shape every workspace multi-driver manager uses (cache,
 *   queue, storage, http). Built-in drivers — `memory`, `storage`,
 *   `api` — are resolved by convention through
 *   `create{Studly}Driver()` methods; custom drivers register via
 *   `manager.extend(name, creator)` at runtime.
 */

import { Injectable, Inject, Optional } from '@stackra/container';
import { MultipleInstanceManager } from '@stackra/support';
import {
  HTTP_MANAGER,
  SETTINGS_CONFIG,
  STORAGE_MANAGER,
  type IHttpManager,
  type IStorageManager,
  type ISettingsConfig,
  type ISettingsManager,
  type ISettingsStore,
  type IApiStoreDriverConfig,
  type IStorageStoreDriverConfig,
} from '@stackra/contracts';

import { SettingsDriverNotRegisteredError } from '@/core/errors';
import { ApiSettingsStore } from '@/core/stores/api-settings.store';
import { MemorySettingsStore } from '@/core/stores/memory-settings.store';
import { StorageSettingsStore } from '@/core/stores/storage-settings.store';

/**
 * `ISettingsManager` implementation — resolves named
 * `ISettingsStore` drivers, caches instances, honours per-group
 * overrides configured under `config.groups`.
 */
@Injectable()
export class SettingsStoreManager
  extends MultipleInstanceManager<ISettingsStore>
  implements ISettingsManager
{
  /**
   * @param config - Merged settings configuration.
   * @param storageManager - Optional storage manager — required only
   *   when the config declares a `storage` driver.
   * @param httpManager - Optional HTTP manager — required only when
   *   the config declares an `api` driver.
   */
  public constructor(
    @Inject(SETTINGS_CONFIG) private readonly config: ISettingsConfig,
    @Optional() @Inject(STORAGE_MANAGER) private readonly storageManager?: IStorageManager,
    @Optional() @Inject(HTTP_MANAGER) private readonly httpManager?: IHttpManager
  ) {
    super();
  }

  // ══════════════════════════════════════════════════════════════════
  // MultipleInstanceManager contract
  // ══════════════════════════════════════════════════════════════════

  /** Optional override written by `setDefaultInstance`. */
  private defaultInstanceOverride?: string;

  /** @inheritDoc */
  public getDefaultInstance(): string {
    return this.defaultInstanceOverride ?? this.config.default;
  }

  /**
   * Change the default instance name at runtime. The merged config
   * remains immutable — the override is tracked internally.
   */
  public setDefaultInstance(name: string): void {
    this.defaultInstanceOverride = name;
  }

  /** @inheritDoc */
  public getInstanceConfig(name: string): Record<string, unknown> | null {
    const cfg = this.config.stores[name];
    return cfg ? (cfg as unknown as Record<string, unknown>) : null;
  }

  // ══════════════════════════════════════════════════════════════════
  // ISettingsManager surface
  // ══════════════════════════════════════════════════════════════════

  /**
   * Store the settings package should use for a specific group,
   * honouring per-group overrides configured under `config.groups`.
   */
  public storeForGroup(groupKey: string): ISettingsStore {
    const override = this.config.groups?.[groupKey]?.store;
    return this.instance(override ?? this.getDefaultInstance());
  }

  // ══════════════════════════════════════════════════════════════════
  // Built-in drivers — resolved by convention
  // ══════════════════════════════════════════════════════════════════

  /** Convention: `driver: 'memory'` → `MemorySettingsStore`. */
  protected createMemoryDriver(): ISettingsStore {
    return new MemorySettingsStore();
  }

  /**
   * Convention: `driver: 'storage'` → wraps a named `IStorage`
   * instance from `STORAGE_MANAGER`.
   */
  protected createStorageDriver(config: Record<string, unknown>): ISettingsStore {
    if (!this.storageManager) {
      throw new SettingsDriverNotRegisteredError(
        'storage — @stackra/storage peer is not installed'
      );
    }
    const typed = config as unknown as IStorageStoreDriverConfig;
    return new StorageSettingsStore({
      manager: this.storageManager,
      instanceName: typed.storageInstance ?? this.config.default,
      prefix: typed.prefix ?? this.config.prefix,
    });
  }

  /**
   * Convention: `driver: 'api'` → wraps `HTTP_MANAGER`.
   *
   * Resolves the optional `fallbackStore` lazily so the API store
   * can chain into any peer instance in this manager (typically
   * `localStorage`) without triggering circular construction.
   */
  protected createApiDriver(config: Record<string, unknown>): ISettingsStore {
    if (!this.httpManager) {
      throw new SettingsDriverNotRegisteredError('api — @stackra/http peer is not installed');
    }
    const typed = config as unknown as IApiStoreDriverConfig;

    // Resolve fallback lazily to avoid re-entrant construction.
    const fallback = typed.fallbackStore ? this.instance(typed.fallbackStore) : undefined;

    return new ApiSettingsStore({
      httpManager: this.httpManager,
      connection: typed.httpClient ?? this.config.api.httpClient,
      endpoints: this.config.api.endpoints,
      baseUrl: typed.baseUrl ?? this.config.api.baseUrl,
      headers: typed.headers,
      query: typed.query,
      retry: typed.retry,
      fallback,
      onError: typed.onError,
    });
  }
}
