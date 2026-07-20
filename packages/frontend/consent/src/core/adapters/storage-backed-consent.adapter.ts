/**
 * @file storage-backed-consent.adapter.ts
 * @module @stackra/consent/core/adapters
 * @description Cross-platform `IConsentStorageAdapter` that delegates
 *   to a named `IStorage` resolved from `@stackra/storage`'s manager.
 *
 *   Replaces `LocalStorageConsentAdapter` (web) and any future
 *   `AsyncStorageConsentAdapter` (native): consumers pick the
 *   underlying persistence store via
 *   `WebStorageModule.forRoot({ stores: { consent: {...} } })` /
 *   `NativeStorageModule.forRoot({ ... })`, and this adapter is
 *   platform-agnostic.
 */

import { Inject, Injectable, Optional } from '@stackra/container';
import {
  CONSENT_CONFIG,
  STORAGE_MANAGER,
  type IConsentStorageAdapter,
  type IStorage,
  type IStorageManager,
} from '@stackra/contracts';

import { DEFAULT_COOKIE_NAME } from '@/core/constants';
import type { IConsentModuleOptions } from '@/core/types';

/**
 * Storage-backed consent persistence adapter.
 *
 * Injects the storage manager and resolves a named `IStorage`
 * instance on first use. The instance name comes from
 * `IConsentModuleOptions.storage` — the same field consumers already
 * use to hint at the persistence backend.
 *
 * Convention: the app configures the matching instance in its
 * `WebStorageModule.forRoot({ stores })` / `NativeStorageModule` —
 * e.g. `storage: 'localStorage'` on consent maps to an instance
 * named `'localStorage'` on the manager. Custom drivers registered
 * via `StorageModule.forFeature(name, Class)` work the same way —
 * pass their name here.
 *
 * @example
 * ```typescript
 * @Module({
 *   imports: [
 *     WebStorageModule.forRoot({
 *       default: 'localStorage',
 *       stores: { localStorage: { driver: 'localStorage', prefix: 'app' } },
 *     }),
 *     ConsentModule.forRoot({
 *       categories: DEFAULT_CATEGORIES,
 *       storage: 'localStorage',
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Injectable()
export class StorageBackedConsentAdapter implements IConsentStorageAdapter {
  /** Storage key inside the resolved `IStorage`. */
  private readonly key: string;

  /** Named `IStorage` instance to resolve from the manager. */
  private readonly instanceName: string;

  /** Lazy — resolved on first access. */
  private cached: IStorage | null = null;

  /**
   * @param manager - The resolved `IStorageManager` (from
   *   `WebStorageModule` / `NativeStorageModule`).
   * @param options - Consent module config.
   */
  public constructor(
    @Inject(STORAGE_MANAGER) private readonly manager: IStorageManager,
    @Optional() @Inject(CONSENT_CONFIG) options?: IConsentModuleOptions
  ) {
    this.key = options?.cookieName ?? DEFAULT_COOKIE_NAME;
    // The `storage` field IS the instance name. When omitted, the
    // manager's default instance is used (via manager.instance() with
    // no argument).
    this.instanceName = options?.storage ?? '';
  }

  /** @inheritdoc */
  public async load(): Promise<Record<string, boolean> | null> {
    return (await this.storage().get<Record<string, boolean>>(this.key)) ?? null;
  }

  /** @inheritdoc */
  public async save(prefs: Record<string, boolean>): Promise<void> {
    await this.storage().set(this.key, prefs);
  }

  /** @inheritdoc */
  public async clear(): Promise<void> {
    await this.storage().delete(this.key);
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
