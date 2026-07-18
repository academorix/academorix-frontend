/**
 * @file index.ts
 * @module @stackra/decorators/cache
 *
 * @description
 * Public API barrel for the cache domain decorators. Only ships the
 * class-level discoverable decorator (`@CacheStore`). The method-level
 * `@Cacheable` / `@CacheEvict` decorators live in `@stackra/cache`
 * itself because they run container-aware side effects at call time
 * (they wrap the method body) — outside the "pure metadata stamp"
 * contract this package guarantees.
 */

export { CacheStore, cacheStoreMetadata } from "./cache-store.decorator";
