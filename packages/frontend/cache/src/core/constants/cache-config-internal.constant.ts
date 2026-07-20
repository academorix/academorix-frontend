/**
 * @file cache-config-internal.constant.ts
 * @module @stackra/cache/core/constants
 * @description Package-internal DI token holding the resolved
 *   `ICacheModuleConfig` value bound by `CacheModule.forRoot` /
 *   `CacheModule.forRootAsync`.
 *
 *   This token is **not** exported from the package's public API
 *   barrel. Consumers reach the config through the app-owned
 *   `cacheConfig.KEY` on a `registerAs(...)` factory from
 *   `@stackra/config` (see the "Config factory" section in
 *   `.kiro/steering/package-conventions.md`), never through this
 *   symbol.
 */

/**
 * Package-internal DI token for `CacheModule`'s resolved config
 * value.
 *
 * Bound by `CacheModule.forRoot` / `CacheModule.forRootAsync` and
 * injected only by classes inside `@stackra/cache` — the manager,
 * store loader, and any future service that needs the merged
 * configuration. Consumers MUST NOT import this token; the
 * canonical way to reach the same config is
 * `@Inject(cacheConfig.KEY)` where `cacheConfig` is an app-owned
 * `registerAs` factory registered via
 * `ConfigModule.forRoot({ load: [cacheConfig] })`.
 *
 * @internal
 */
export const CACHE_CONFIG_INTERNAL = Symbol("@stackra/cache:config-internal");
