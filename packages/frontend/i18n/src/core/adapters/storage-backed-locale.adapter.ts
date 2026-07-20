/**
 * @file storage-backed-locale.adapter.ts
 * @module @stackra/i18n/core/adapters
 * @description Cross-platform `ILocaleStorage` backed by
 *   `@stackra/storage`. Resolves a named `IStorage` from the app's
 *   `StorageManager` and reads / writes the persisted locale as a
 *   single key.
 *
 *   Replaces both `WebStorageAdapter` (localStorage) and
 *   `AsyncStorageLocaleAdapter` (AsyncStorage) — one code path for
 *   web + native. The backing driver is a config choice on
 *   `StorageManager`, not a compile-time choice on the adapter.
 */

import { Inject, Injectable, Optional } from '@stackra/container';
import {
  STORAGE_MANAGER,
  type ILocaleStorage,
  type IStorage,
  type IStorageManager,
} from '@stackra/contracts';

import { I18N_CONFIG } from '@/core/constants';
import type { II18nConfig } from '@/core/interfaces';

/** Default storage key when the config doesn't override it. */
const DEFAULT_STORAGE_KEY = 'stackra_locale';

/**
 * `ILocaleStorage` implementation backed by `IStorage`.
 *
 * Injects the storage manager and resolves a named `IStorage`
 * instance on first use. The instance name comes from
 * `II18nConfig.storage`; the storage key comes from
 * `II18nConfig.storageKey` (default: `'stackra_locale'`).
 *
 * @example
 * ```typescript
 * @Module({
 *   imports: [
 *     WebStorageModule.forRoot({
 *       default: 'localStorage',
 *       stores: { localStorage: { driver: 'localStorage', prefix: 'app' } },
 *     }),
 *     I18nModule.forRoot({
 *       defaultLocale: 'en',
 *       supportedLocales: ['en', 'ar'],
 *       storage: 'localStorage',
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Injectable()
export class StorageBackedLocaleAdapter implements ILocaleStorage {
  /** Storage key inside the resolved `IStorage`. */
  private readonly storageKey: string;

  /** Named `IStorage` instance to resolve from the manager. */
  private readonly instanceName: string;

  /** Lazy — resolved on first access. */
  private cached: IStorage | null = null;

  /**
   * @param manager - The resolved `IStorageManager` (from
   *   `WebStorageModule` / `NativeStorageModule`).
   * @param config - I18n module config.
   */
  public constructor(
    @Inject(STORAGE_MANAGER) private readonly manager: IStorageManager,
    @Optional() @Inject(I18N_CONFIG) config?: II18nConfig
  ) {
    this.instanceName = config?.storage ?? '';
    this.storageKey = config?.storageKey ?? DEFAULT_STORAGE_KEY;
  }

  /** @inheritdoc */
  public async getLocale(): Promise<string | null> {
    return (await this.storage().get<string>(this.storageKey)) ?? null;
  }

  /** @inheritdoc */
  public async setLocale(locale: string): Promise<void> {
    await this.storage().set(this.storageKey, locale);
  }

  /** @inheritdoc */
  public async clearLocale(): Promise<void> {
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
