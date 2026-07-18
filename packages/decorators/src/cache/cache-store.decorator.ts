/**
 * @file cache-store.decorator.ts
 * @module @stackra/decorators/cache
 *
 * @description
 * The `@CacheStore('name')` class decorator — marks a class as a
 * discoverable cache-store implementation.
 *
 * Stamps the store name under `CACHE_STORE_METADATA_KEY` and
 * applies `@Injectable()`. The `CacheManager` reads the metadata
 * at bootstrap via
 * `discovery.getProvidersByMetadata(CACHE_STORE_METADATA_KEY)`
 * and registers each discovered instance by name.
 */

import { CACHE_STORE_METADATA_KEY } from "@stackra/contracts";

import { createDiscoverableClassDecorator, createMetadataReader } from "../core";

/**
 * Mark a class as a discoverable `ICacheStore` implementation.
 *
 * @param name Unique store identifier (e.g. `'redis'`, `'memory'`).
 * @returns A `ClassDecorator` that stamps the store name and
 *   applies `@Injectable()`.
 *
 * @example
 * ```typescript
 * import { CacheStore } from '@stackra/decorators/cache';
 * import type { ICacheStore } from '@stackra/contracts';
 *
 * @CacheStore('redis')
 * export class RedisCacheStore implements ICacheStore {
 *   public readonly name = 'redis';
 *   public async get<T>(key: string): Promise<T | undefined> { … }
 *   // ...
 * }
 * ```
 */
export const CacheStore = createCacheStoreDecorator();

/** Reader for `@CacheStore(...)` metadata. */
export const cacheStoreMetadata = createMetadataReader<string>(CACHE_STORE_METADATA_KEY);

/**
 * Internal — bridges the natural `@CacheStore('name')` signature
 * to the factory's single-options argument.
 */
function createCacheStoreDecorator(): (name: string) => ClassDecorator {
  const base = createDiscoverableClassDecorator<string>(CACHE_STORE_METADATA_KEY);
  return (name: string) => base(name);
}
