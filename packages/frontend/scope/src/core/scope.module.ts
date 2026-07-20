/**
 * @file scope.module.ts
 * @module @stackra/scope/core
 * @description Client scope DI module.
 *
 *   Wires the injectable `ScopeService` (the in-memory store for the active
 *   scope + tree + emulation). The app supplies an `IScopeDataSource`
 *   (bridging to its backend API) either inline via `forRoot({ dataSource })`
 *   or as a class via `forRootAsync`.
 *
 *   When the caller sets `storage: '<instance>'`, the module binds
 *   `StorageBackedScopePersistAdapter` under `SCOPE_PERSIST_ADAPTER` —
 *   the adapter injects `STORAGE_MANAGER` + `SCOPE_CONFIG` on its own.
 *   `SCOPE_DATA_SOURCE`'s factory optionally injects the adapter and
 *   wraps the app-provided data source via `withPersistAdapter`, so
 *   `setScope` also writes the active node id to `IStorage`.
 */

import { Module, type DynamicModule, type Provider } from "@stackra/container";
import { DevtoolsModule } from "@stackra/devtools";
import { SCOPE_PERSIST_ADAPTER, type IAsyncModuleOptions } from "@stackra/contracts";

import { SCOPE_CONFIG, SCOPE_DATA_SOURCE, SCOPE_SERVICE } from "./constants";
import { StorageBackedScopePersistAdapter } from "./adapters/storage-backed-scope-persist.adapter";
import { mergeConfig } from "./utils/merge-config.util";
import { withPersistAdapter } from "./utils/with-persist-adapter.util";
import { ScopeService } from "./services/scope.service";
import type { IScopeDataSource, IScopeModuleOptions, IScopePersistAdapter } from "./interfaces";
import { ScopeDevtoolsPanel } from "../react/devtools/scope.devtools-panel";
import { ScopeInspectorSource } from "../react/devtools/scope.inspector-source";

/** Options accepted by `ScopeModule.forRoot`. */
export interface ScopeRootOptions extends IScopeModuleOptions {
  /** App-provided data source bridging the client to your backend API. */
  readonly dataSource?: IScopeDataSource;
}

/**
 * Decide whether the caller opted into durable persistence. `'memory'`
 * (or omitted) means "keep in-memory only" and skips the storage
 * adapter wiring altogether.
 */
function needsStorageBacking(storage: ScopeRootOptions["storage"]): boolean {
  return !!storage && storage !== "memory";
}

/**
 * Provider producer for the persist adapter — only bound when the
 * caller opted into storage-backed persistence. When bound, the
 * adapter itself injects `STORAGE_MANAGER` + `SCOPE_CONFIG` via its
 * own `@Inject` decorators.
 */
function persistAdapterProviders(wantsStorage: boolean): Provider[] {
  if (!wantsStorage) return [];
  return [
    StorageBackedScopePersistAdapter,
    { provide: SCOPE_PERSIST_ADAPTER, useExisting: StorageBackedScopePersistAdapter },
  ];
}

/**
 * Client scope module.
 *
 * @example
 * ```typescript
 * @Module({
 *   imports: [
 *     WebStorageModule.forRoot({
 *       default: 'localStorage',
 *       stores: { localStorage: { driver: 'localStorage', prefix: 'app' } },
 *     }),
 *     ScopeModule.forRoot({
 *       dataSource: new HttpScopeDataSource(api),
 *       initialScope: scopeFromServer,
 *       storage: 'localStorage',
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
export class ScopeModule {
  /**
   * Register the client scope service globally.
   */
  public static forRoot(options: ScopeRootOptions = {}): DynamicModule {
    const { dataSource, ...configOptions } = options;
    const config = mergeConfig(configOptions);
    const wantsStorage = needsStorageBacking(options.storage);

    // SCOPE_DATA_SOURCE optionally injects SCOPE_PERSIST_ADAPTER and
    // wraps the app-provided data source when the adapter is present.
    // When storage is disabled the adapter isn't bound → factory sees
    // undefined → data source is passed through unchanged.
    const dataSourceProvider: Provider = {
      provide: SCOPE_DATA_SOURCE,
      useFactory: (adapter?: IScopePersistAdapter) =>
        dataSource && adapter ? withPersistAdapter(dataSource, adapter) : (dataSource ?? null),
      inject: [{ token: SCOPE_PERSIST_ADAPTER, optional: true }],
    };

    return {
      module: ScopeModule,
      global: true,
      // Contribute the devtools scope panel + `[data-scope]` inspector
      // source. `DevtoolsModule.forFeature` is fail-soft — when the
      // consumer app hasn't wired `DevtoolsModule.forRoot()` the seed
      // loaders become no-ops and neither the panel nor the source
      // reach any registry.
      imports: [
        DevtoolsModule.forFeature([ScopeDevtoolsPanel]),
        DevtoolsModule.forInspectorSource([ScopeInspectorSource]),
      ],
      providers: [
        { provide: SCOPE_CONFIG, useValue: config },
        ...persistAdapterProviders(wantsStorage),
        dataSourceProvider,
        ScopeService,
        { provide: SCOPE_SERVICE, useExisting: ScopeService },
      ],
      exports: [SCOPE_CONFIG, SCOPE_DATA_SOURCE, SCOPE_SERVICE, ScopeService],
    };
  }

  /**
   * Async variant — resolve options (and typically the data source) via a
   * factory. Provide the data source through the factory's return value or
   * as a separate provider.
   *
   * The storage-backed persist adapter is always bound in this form —
   * an async factory implies the caller wants a fully-wired production
   * setup. When their factory returns `storage: 'memory'` (or omits
   * the field), the adapter is still constructible but the wrapper
   * short-circuits and passes the data source through unwrapped.
   */
  public static forRootAsync(options: IAsyncModuleOptions<ScopeRootOptions>): DynamicModule {
    return {
      module: ScopeModule,
      global: true,
      imports: [
        ...(options.imports ?? []),
        // Devtools scope panel + inspector source — see forRoot for the
        // fail-soft rationale.
        DevtoolsModule.forFeature([ScopeDevtoolsPanel]),
        DevtoolsModule.forInspectorSource([ScopeInspectorSource]),
      ],
      providers: [
        {
          provide: SCOPE_CONFIG,
          useFactory: async (...args: unknown[]) => {
            const resolved = await options.useFactory(...args);
            const { dataSource: _ds, ...configOptions } = resolved;
            void _ds;
            return mergeConfig(configOptions);
          },
          inject: options.inject ?? [],
        },
        // Always register the adapter class — its own `@Inject` picks
        // up STORAGE_MANAGER (required) + SCOPE_CONFIG (optional).
        // The token binding + data-source wrapping happens below.
        StorageBackedScopePersistAdapter,
        { provide: SCOPE_PERSIST_ADAPTER, useExisting: StorageBackedScopePersistAdapter },
        {
          provide: SCOPE_DATA_SOURCE,
          useFactory: async (adapter: IScopePersistAdapter | undefined, ...args: unknown[]) => {
            const resolved = await options.useFactory(...args);
            const ds = resolved.dataSource ?? null;
            if (!ds || !needsStorageBacking(resolved.storage) || !adapter) return ds;
            return withPersistAdapter(ds, adapter);
          },
          inject: [{ token: SCOPE_PERSIST_ADAPTER, optional: true }, ...(options.inject ?? [])],
        },
        ScopeService,
        { provide: SCOPE_SERVICE, useExisting: ScopeService },
      ],
      exports: [SCOPE_CONFIG, SCOPE_SERVICE, ScopeService, SCOPE_DATA_SOURCE],
    };
  }
}
