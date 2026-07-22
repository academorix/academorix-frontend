/**
 * @file cache-manager.service.ts
 * @module @stackra/cache/core/services
 * @description Multi-instance cache manager built on
 *   `MultipleInstanceManager`. Resolves named cache stores lazily
 *   from `config.stores[name]` — each store carries its own driver +
 *   config, matching the shape `MultipleInstanceManager` models.
 *
 *   Public API stays exactly the same as before the base-class swap:
 *   `store(name?)` returns an `ICacheStore`, `extend(driver, factory)`
 *   registers a custom driver, and `getDefaultDriver()` still works
 *   for consumers reading the config's default store name.
 *
 *   Migration note: this class previously extended
 *   `Manager<ICacheStore>` which models one shared driver factory.
 *   Cache's config carries per-store settings (`stores.<name>.ttl`,
 *   `stores.redis.host`, etc.), so `MultipleInstanceManager<T>` is
 *   the correct base per `.kiro/steering/package-conventions.md`
 *   §"Manager base — pick the right one" and the audit at
 *   `.kiro/reports/manager-base-class-review-2026-07-22.md` F1.
 */

import { Injectable, Inject } from "@stackra/container";
import { ICacheStore } from "@stackra/contracts";
import { MultipleInstanceManager } from "@stackra/support";

import type { ICacheModuleConfig } from "@/core/interfaces";

import { CACHE_CONFIG_INTERNAL } from "@/core/constants/cache-config-internal.constant";
import { MemoryStore } from "@/core/stores/memory.store";
import { NullStore } from "@/core/stores/null.store";

/**
 * Multi-instance cache manager.
 *
 * Extends `MultipleInstanceManager<ICacheStore>` from `@stackra/support`
 * to resolve named cache stores lazily with per-store config injection.
 * Each store is created on first access and cached for subsequent calls.
 *
 * Built-in drivers:
 * - `memory` — in-process Map with passive TTL expiry
 * - `null` — no-op store for testing
 *
 * Custom drivers register via `extend(driver, factory)`:
 * ```typescript
 * cacheManager.extend('redis', (config) => new RedisStore(config));
 * ```
 *
 * @example
 * ```typescript
 * const manager = container.get<CacheManager>(CACHE_MANAGER);
 * const memoryStore = manager.store('memory');
 * await memoryStore.set('key', 'value', 300);
 * ```
 */
@Injectable()
export class CacheManager extends MultipleInstanceManager<ICacheStore> {
  /**
   * @param config - Cache module configuration injected via DI. Bound
   *   by `CacheModule.forRoot` / `.forRootAsync` under the
   *   package-internal `CACHE_CONFIG_INTERNAL` symbol.
   */
  public constructor(@Inject(CACHE_CONFIG_INTERNAL) private readonly config: ICacheModuleConfig) {
    super();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MultipleInstanceManager contract
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * @inheritdoc
   * Returns the store name from `config.default`.
   */
  public getDefaultInstance(): string {
    return this.config.default;
  }

  /**
   * @inheritdoc
   * Mutates the in-memory `config.default` for the process lifetime;
   * does not persist back to any external config store.
   */
  public setDefaultInstance(name: string): void {
    this.config.default = name;
  }

  /**
   * @inheritdoc
   * Returns the per-store config from `config.stores[name]`, or
   * `null` when the name is not declared.
   */
  public getInstanceConfig(name: string): Record<string, unknown> | null {
    return (this.config.stores[name] as unknown as Record<string, unknown>) ?? null;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Public API
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Get the name of the default cache driver from configuration.
   *
   * Kept for backwards compatibility with pre-migration consumers.
   * New code should call `getDefaultInstance()` — same value, canonical
   * name from `MultipleInstanceManager`.
   *
   * @returns The configured default store name
   */
  public getDefaultDriver(): string {
    return this.getDefaultInstance();
  }

  /**
   * Resolve a named cache store instance.
   *
   * Domain alias for `MultipleInstanceManager.instance(name)` — reads
   * naturally at call sites (`manager.store('redis')` vs.
   * `manager.instance('redis')`). Cache semantics don't change.
   *
   * @param name - Store name (defaults to the configured default)
   * @returns The resolved cache store instance
   */
  public store(name?: string): ICacheStore {
    return this.instance(name);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Built-in driver factories
  //
  // Convention: `create{StudlyDriverName}Driver(config)` per
  // MultipleInstanceManager. `driverKey` defaults to 'driver' — matches
  // `ICacheStoreConfig.driver`.
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Create the built-in memory driver.
   *
   * @param _config - The store's config entry from `stores[name]`.
   *   MemoryStore currently ignores driver-specific config; the
   *   argument is kept to match the base-class convention.
   * @returns A new MemoryStore instance
   */
  protected createMemoryDriver(_config: Record<string, unknown>): ICacheStore {
    return new MemoryStore();
  }

  /**
   * Create the built-in null driver.
   *
   * @param _config - The store's config entry (ignored — null-store
   *   has no config surface).
   * @returns A new NullStore instance
   */
  protected createNullDriver(_config: Record<string, unknown>): ICacheStore {
    return new NullStore();
  }
}
