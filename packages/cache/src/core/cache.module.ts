/**
 * @file cache.module.ts
 * @module @stackra/cache/core
 * @description DI module for the cache system.
 *
 *   Registers the CacheManager and CacheService globally. Two entry
 *   points are supported:
 *
 *     - `forRoot(config)` — synchronous, pass a fully-formed
 *       `ICacheModuleConfig`. Prefer authoring the config via
 *       `registerAs('cache', () => ({...}))` from `@stackra/config`
 *       and threading it in via `forRootAsync(cacheConfig.asProvider())`;
 *       `forRoot` is kept as an escape hatch for tests and inline
 *       usage.
 *
 *     - `forRootAsync(options)` — accepts either a hand-written
 *       `{ useFactory, inject, imports }` shape OR the exact object
 *       returned by `cacheConfig.asProvider()`. Both are
 *       structurally the canonical `IConfigModuleAsyncOptions<T>`
 *       from `@stackra/contracts`.
 *
 *   The resolved config is bound under `CACHE_CONFIG_INTERNAL`, a
 *   package-private symbol that only classes inside `@stackra/cache`
 *   inject. Consumers who want to read the same config value do so
 *   via `@Inject(cacheConfig.KEY)` on the app-owned `registerAs`
 *   factory — never through this token.
 */

import { Module, type DynamicModule } from "@stackra/container";
import { CACHE_MANAGER } from "@stackra/contracts";
import { Path, createSeedLoader, seedLoaderToken } from "@stackra/support";

import { CACHE_CONFIG_INTERNAL } from "./constants/cache-config-internal.constant";
import { CacheManager } from "./services/cache-manager.service";
import { CacheStoreLoader } from "./services/cache-store-loader.service";
import { CacheService } from "./services/cache.service";

import type { ICacheModuleConfig } from "./interfaces";
import type { IConfigModuleAsyncOptions, IPublishableConsumer } from "@stackra/contracts";

// NOTE: `@stackra/devtools` runtime is pending. Once promoted, the
// `CacheDevtoolsPanel` (built with `@DevtoolsPanel(...)` from
// `@stackra/decorators/devtools`) can be contributed here via
// `imports: [DevtoolsModule.forFeature([CacheDevtoolsPanel])]`.

/**
 * Cache DI module.
 *
 * Provides the CacheManager and CacheService globally. The CacheModule
 * works directly in both container and NestJS contexts (no separate
 * adapter package needed).
 *
 * @example
 * ```typescript
 * // Preferred — `@stackra/config` factory + `forRootAsync`:
 * import { registerAs, env } from '@stackra/config';
 * import { CacheModule } from '@stackra/cache';
 *
 * const cacheConfig = registerAs('cache', () => ({
 *   default: env('CACHE_STORE', 'memory'),
 *   stores: { memory: { driver: 'memory' } },
 *   ttl: env.number('CACHE_TTL', 3600),
 * }));
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
@Module({})
export class CacheModule {
  /**
   * Absolute path to the `@stackra/cache` package root.
   *
   * Resolved once from `import.meta.url` at module load. `public` so
   * `@stackra/console`'s `PublishableConsumer` can auto-read it and
   * fill in `packageRoot` on every `.publish(entry)` call — the
   * module doesn't have to pass it manually.
   *
   * `../../..` walks from `packages/cache/src/core/` up to
   * `packages/cache/`.
   */
  public static readonly PACKAGE_ROOT = Path.packageRoot(import.meta.url);

  /**
   * Register the cache module globally with a fully-formed config.
   *
   * Prefer `forRootAsync(cacheConfig.asProvider())` in app code — this
   * synchronous form is kept as an escape hatch for tests and
   * inline configs.
   *
   * @param config - The fully-formed cache module configuration.
   * @returns A `DynamicModule` binding `CacheManager`, `CacheService`,
   *   and the auto-discovery `CacheStoreLoader`.
   * @throws Error when `config` is `undefined` / `null`. Defaults now
   *   live inline in the app-level `registerAs` factory; the package
   *   has no `DEFAULT_CACHE_CONFIG` fallback anymore.
   */
  public static forRoot(config: ICacheModuleConfig): DynamicModule {
    // Guard clause — the caller must supply a fully-formed config.
    // We used to fall back to `DEFAULT_CACHE_CONFIG` here; that
    // constant was removed in the `@stackra/config` migration
    // (see `.kiro/specs/stackra-config-package/PLAN.md` §5.2).
    if (config === undefined || config === null) {
      throw new Error(
        "@stackra/cache: CacheModule.forRoot(config) requires a config argument. " +
          "Pass a plain `ICacheModuleConfig`, or use " +
          "`CacheModule.forRootAsync(cacheConfig.asProvider())` with a " +
          "`registerAs(...)` factory from `@stackra/config`. See " +
          ".kiro/specs/stackra-config-package/PLAN.md §9 for consumer patterns.",
      );
    }

    return {
      module: CacheModule,
      global: true,
      providers: [
        // Package-internal binding — only classes inside @stackra/cache
        // inject this token. Consumers use `cacheConfig.KEY` at the app
        // level instead.
        { provide: CACHE_CONFIG_INTERNAL, useValue: config },

        // Manager: register both the class token and its symbol alias so
        // callers can inject either.
        {
          provide: CACHE_MANAGER,
          useClass: CacheManager,
        },
        CacheService,

        // Auto-discovery loader — scans for @CacheStore() decorated
        // providers and registers them with the CacheManager at
        // bootstrap.
        CacheStoreLoader,
      ],
      // NOTE: `CACHE_CONFIG_INTERNAL` is intentionally NOT exported —
      // it is a package-private binding. Downstream modules that need
      // the config should inject via the app-owned `cacheConfig.KEY`.
      exports: [CACHE_MANAGER, CacheService],
    };
  }

  /**
   * Register the cache module globally with an async config.
   *
   * Accepts either the traditional `{ useFactory, inject, imports }`
   * shape OR the exact object returned by `cacheConfig.asProvider()`
   * (they're structurally identical — both satisfy
   * `IConfigModuleAsyncOptions<ICacheModuleConfig>`).
   *
   * @param options - Async configuration options. When threading a
   *   `registerAs(...)` factory in, pass `cacheConfig.asProvider()`
   *   directly.
   * @returns A `DynamicModule` with the same provider tree as
   *   `forRoot`, but the config resolves via `options.useFactory`.
   */
  public static forRootAsync(
    options: IConfigModuleAsyncOptions<ICacheModuleConfig>,
  ): DynamicModule {
    return {
      module: CacheModule,
      global: true,
      imports: options.imports ?? [],
      providers: [
        // Same package-private binding as `forRoot`, but the value is
        // produced by the async factory. `cacheConfig.asProvider()`
        // slots in here verbatim.
        {
          provide: CACHE_CONFIG_INTERNAL,
          useFactory: options.useFactory,
          inject: options.inject ?? [],
        },
        {
          provide: CACHE_MANAGER,
          useClass: CacheManager,
        },
        CacheService,

        // Auto-discovery loader.
        CacheStoreLoader,
      ],
      exports: [CACHE_MANAGER, CacheService],
    };
  }

  /**
   * Register a custom cache store driver.
   *
   * The driver class is instantiated via DI and registered on the
   * `CacheManager` via `extend(driver, factory)`. This enables
   * external packages to add store implementations (redis,
   * indexeddb, etc.) without modifying the cache configuration.
   *
   * Registration is threaded through the shared
   * `createSeedLoader` + `seedLoaderToken` helpers from
   * `@stackra/support` so it runs in the proper lifecycle phase
   * (`onApplicationBootstrap`) — never as a synthetic sentinel
   * factory (see `.kiro/steering/module-lifecycle.md`).
   *
   * @param driver - Driver name (e.g., 'redis', 'indexeddb').
   * @param storeClass - Store class implementing `ICacheStore`.
   * @returns A `DynamicModule` contributing the store + its seeder.
   *
   * @example
   * ```typescript
   * CacheModule.forFeature('redis', RedisCacheStore);
   * // or register several at once:
   * CacheModule.forFeature({ redis: RedisCacheStore, idb: IdbCacheStore });
   * ```
   */
  public static forFeature(driver: string, storeClass: Function): DynamicModule;
  public static forFeature(stores: Record<string, Function>): DynamicModule;
  public static forFeature(
    driverOrStores: string | Record<string, Function>,
    storeClass?: Function,
  ): DynamicModule {
    // Normalise both overloads to a `[name, ctor][]` list so the
    // provider fan-out below is a single loop.
    const entries: [string, Function][] =
      typeof driverOrStores === "string"
        ? [[driverOrStores, storeClass as Function]]
        : Object.entries(driverOrStores);

    return {
      module: CacheModule,
      providers: entries.flatMap(([driver, ctor]) => [
        ctor as any,
        {
          // `seedLoaderToken(...)` returns a fresh `Symbol()` per call
          // so multiple `forFeature` contributions don't collide under
          // the container's last-wins token semantics.
          provide: seedLoaderToken(`cache-store:${driver}`),
          useFactory: (manager: CacheManager, store: any) =>
            createSeedLoader(() => manager.extend(driver, () => store)),
          inject: [CacheManager, ctor as any],
        },
      ]),
      exports: entries.map(([, ctor]) => ctor as any),
    };
  }

  // ══════════════════════════════════════════════════════════════════════
  // configurePublishables — module-level manifest of publishable files
  // ══════════════════════════════════════════════════════════════════════

  /**
   * Declare every publishable resource `@stackra/cache` owns.
   *
   * Discovered at CLI boot by `@stackra/console`'s `PublishableLoader`.
   * The SPA never reaches this method — `PublishableLoader` runs only
   * inside the CLI kernel.
   *
   * `packageRoot` is auto-filled from `PACKAGE_ROOT` above, so entries
   * only declare their `files` (paths relative to package root — the
   * destination mirrors the same relative path in the consumer app).
   *
   * @param consumer - Fluent builder that accepts `.publish(entry)` calls.
   */
  public static configurePublishables(consumer: IPublishableConsumer): void {
    consumer.publish({
      tag: "cache-config",
      description: "Reference @stackra/cache config file for the app.",
      files: ["config/cache.config.ts"],
    });
  }
}
