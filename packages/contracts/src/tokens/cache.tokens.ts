/**
 * @file cache.tokens.ts
 * @module @stackra/contracts/tokens
 * @description DI tokens for the cache system.
 *
 *   NOTE: `CACHE_CONFIG` used to live here. It was removed in the
 *   `@stackra/config` migration — `CacheModule.forRoot` now binds
 *   the resolved config under a package-internal symbol
 *   (`CACHE_CONFIG_INTERNAL` in `@stackra/cache`) and consumers who
 *   want to read the same value do so via `@Inject(cacheConfig.KEY)`
 *   on an app-owned `registerAs(...)` factory. See
 *   `.kiro/specs/stackra-config-package/PLAN.md` §5.2.
 */

/** Token for the CacheManager instance. */
export const CACHE_MANAGER = Symbol.for("CACHE_MANAGER");

/** Metadata key for the @CacheStore() decorator. */
export const CACHE_STORE_METADATA_KEY = "stackra:cache:store";
