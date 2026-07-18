/**
 * @file cache-store-loader.service.ts
 * @module @stackra/cache/core/services
 * @description Auto-discovery loader for `@CacheStore`-decorated classes.
 *   Scans all providers in the DI container at bootstrap time, finds classes
 *   decorated with `@CacheStore`, and registers them as driver factories on
 *   the `CacheManager`.
 *
 *   This enables external packages to contribute cache store implementations
 *   without modifying the cache configuration or calling `forFeature()`.
 *   For example:
 *   - Redis package provides `@CacheStore({ name: "redis", driver: "redis" })`
 *   - IndexedDB package provides `@CacheStore({ name: "idb", driver: "indexeddb" })`
 *
 *   Lifecycle: `onApplicationBootstrap()` — scans providers, registers store
 *   factories (after all modules have initialised).
 */

import { Injectable, Inject, Optional } from "@stackra/container";
import { OnApplicationBootstrap } from "@stackra/container";
import { getMetadata } from "@vivtel/metadata";
import { CACHE_STORE_METADATA_KEY } from "@stackra/contracts";

import { CacheManager } from "./cache-manager.service";

// ════════════════════════════════════════════════════════════════════════════════
// Types
// ════════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════════════════
// DI Token
// ════════════════════════════════════════════════════════════════════════════════

/** DI token for the discovery service (resolved from container or NestJS). */
import { DISCOVERY_SERVICE, CACHE_MANAGER } from "@stackra/contracts";
import type { ICacheStoreOptions } from "@/core/interfaces/cache-store-options.interface";
import type { IDiscoveryService, ICacheStore } from "@stackra/contracts";

// ════════════════════════════════════════════════════════════════════════════════
// Implementation
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Discovers and registers all `@CacheStore`-decorated classes with CacheManager.
 *
 * This service is internal to `CacheModule` — you don't use it directly.
 * It runs automatically after all modules init (`onApplicationBootstrap`).
 *
 * External packages only need to:
 * 1. Decorate their store class with `@CacheStore({ name, driver })`
 * 2. Ensure the class implements `ICacheStore`
 * 3. Register it as a provider in their own module
 *
 * The loader does the rest.
 *
 * @example
 * ```typescript
 * // In @stackra/redis (external package):
 * @CacheStore({ name: 'redis', driver: 'redis' })
 * @Injectable()
 * export class RedisCacheStore implements ICacheStore {
 *   // Automatically registered with CacheManager at bootstrap
 * }
 * ```
 */
@Injectable()
export class CacheStoreLoader implements OnApplicationBootstrap {
  /**
   * @param manager - The CacheManager to register discovered stores into
   * @param discoveryService - Optional discovery service for scanning providers
   */
  public constructor(
    @Inject(CACHE_MANAGER) private readonly manager: CacheManager,
    @Optional() @Inject(DISCOVERY_SERVICE) private readonly discoveryService?: IDiscoveryService,
  ) {}

  /**
   * Called after every module has initialised. Scans for `@CacheStore`
   * metadata and registers matching providers. Container-wide discovery must
   * run in `onApplicationBootstrap` so stores from later-initialised modules
   * aren't missed.
   */
  public onApplicationBootstrap(): void {
    this.loadStores();
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Private
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Scan all providers for `@CacheStore` decorator metadata.
   *
   * For each discovered store:
   * 1. Validates it implements the minimum ICacheStore methods (get, set)
   * 2. Registers it as a custom driver on the CacheManager via `extend()`
   */
  private loadStores(): void {
    if (!this.discoveryService) return;

    const providers = this.discoveryService.getProvidersByMetadata(CACHE_STORE_METADATA_KEY);

    for (const wrapper of providers) {
      const { instance } = wrapper;
      if (!instance) continue;

      const constructor = (instance as { constructor?: Function }).constructor;
      if (!constructor) continue;

      // Read the @CacheStore metadata to get the driver name.
      const storeOptions = getMetadata<ICacheStoreOptions>(
        CACHE_STORE_METADATA_KEY,
        constructor as object,
      );

      if (!storeOptions) continue;

      // Validate the instance implements ICacheStore (duck-type check)
      const store = instance as ICacheStore;
      if (typeof store.get !== "function" || typeof store.set !== "function") {
        continue;
      }

      // Register the store instance as a named driver on the CacheManager.
      // When `manager.store(name)` is called, this instance is returned.
      this.manager.extend(storeOptions.driver, () => store);
    }
  }
}
