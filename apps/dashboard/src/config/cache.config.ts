/**
 * @file cache.config.ts
 * @module @academorix/dashboard/config
 * @description Application-level cache configuration.
 *
 *   Authored as a `registerAs` factory so the value is reachable via
 *   `ConfigService.get('cache')` AND — when threaded through
 *   `CacheModule.forRootAsync(cacheConfig.asProvider())` — through the
 *   cache module's internal binding. The dashboard currently only
 *   surfaces the config through `ConfigService` (it doesn't wire
 *   `CacheModule` yet); this file is ready for both paths.
 *
 * @example
 * ```typescript
 * import { ConfigModule } from '@stackra/config';
 * import { CacheModule } from '@stackra/cache';
 * import { cacheConfig } from '@/config/cache.config';
 *
 * @Module({
 *   imports: [
 *     ConfigModule.forRoot({ isGlobal: true, load: [cacheConfig] }),
 *     CacheModule.forRootAsync(cacheConfig.asProvider()),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */

import { registerAs } from "@stackra/config";
import type { ICacheModuleConfig } from "@stackra/cache";

/**
 * Cache configuration namespace — reachable via
 * `ConfigService.get('cache')` and typed at inject sites through
 * `ConfigType<typeof cacheConfig>`.
 *
 * Every value below is a literal — no `env(...)` reads today. Add
 * `env('CACHE_STORE', 'memory')` etc. when the deployment moves any
 * of these behind a runtime knob.
 */
export const cacheConfig = registerAs<ICacheModuleConfig>("cache", () => ({
  /*
  |--------------------------------------------------------------------------
  | Default Cache Store
  |--------------------------------------------------------------------------
  |
  | This option controls the default cache store that gets used while using
  | the caching API. Of course, you may use other stores whenever you wish.
  | This is the store accessed when calling cache.get() without specifying one.
  |
  */
  default: "memory",

  /*
  |--------------------------------------------------------------------------
  | Cache Stores
  |--------------------------------------------------------------------------
  |
  | Here you may define all of the cache "stores" for your application as
  | well as their drivers. You may even define multiple stores for the same
  | driver to group types of items stored in your caches.
  |
  | Supported drivers: "memory", "null", "storage", "redis" (via plugin)
  |
  */
  stores: {
    memory: { driver: "memory" },
    null: { driver: "null" },
  },

  /*
  |--------------------------------------------------------------------------
  | Cache Key Prefix
  |--------------------------------------------------------------------------
  |
  | When utilizing a RAM-based or shared store such as Redis, there might be
  | other applications using the same cache. For that reason, you may prefix
  | every cache key to avoid collisions.
  |
  */
  prefix: "app:",

  /*
  |--------------------------------------------------------------------------
  | Default Cache TTL
  |--------------------------------------------------------------------------
  |
  | Here you may specify the default number of seconds that items should
  | remain cached when no explicit TTL is provided to the set/put methods.
  | Set to 0 or Infinity for no default expiration.
  |
  */
  ttl: 3600,
}));
