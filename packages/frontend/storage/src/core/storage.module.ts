/**
 * @file storage.module.ts
 * @module @stackra/storage/core
 * @description DI module for the unified KV storage layer. Registers
 *   the `StorageManager` globally under `STORAGE_MANAGER`, the merged
 *   config under `STORAGE_CONFIG`, and the default `IStorage`
 *   instance under `STORAGE` — the token most simple consumers
 *   actually inject.
 */

import { Global, Module, type DynamicModule } from '@stackra/container';
import { DevtoolsModule } from '@stackra/devtools';
import {
  STORAGE,
  STORAGE_CONFIG,
  STORAGE_MANAGER,
  type IAsyncModuleOptions,
  type IStorage,
  type IStorageModuleOptions,
} from '@stackra/contracts';

import { StorageManager } from './services/storage-manager.service';
import { mergeConfig } from './utils/merge-config.util';
import { StorageDevtoolsPanel } from '../react/devtools/storage.devtools-panel';

/**
 * Global DI module for `@stackra/storage`.
 *
 * Registers the manager, its merged config, and the default
 * `IStorage` instance so downstream packages can inject any of
 * them. Platform-specific drivers (`localStorage`, `sessionStorage`,
 * `indexedDB`, `asyncStorage`) live in the `./react` and `./native`
 * subpaths and register onto the manager via `manager.extend(...)`.
 *
 * @example
 * ```typescript
 * import { StorageModule } from '@stackra/storage';
 *
 * @Module({
 *   imports: [
 *     StorageModule.forRoot({
 *       default: 'memory',
 *       stores: { memory: { driver: 'memory' } },
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Global()
@Module({})
export class StorageModule {
  /**
   * Register the storage module globally with static configuration.
   *
   * @param options - Optional overrides. Every field falls back to
   *   `DEFAULT_STORAGE_CONFIG` when omitted, so calling
   *   `forRoot()` with no arguments yields a working single-`memory`
   *   configuration.
   * @returns A `DynamicModule` binding `STORAGE_CONFIG`,
   *   `STORAGE_MANAGER` (aliased to the `StorageManager` class),
   *   and `STORAGE` (the default `IStorage` instance).
   */
  public static forRoot(options?: IStorageModuleOptions): DynamicModule {
    const config = mergeConfig(options);

    return {
      module: StorageModule,
      global: true,
      // Contribute the devtools storage panel. `DevtoolsModule.forFeature`
      // is fail-soft — when the consumer app hasn't wired
      // `DevtoolsModule.forRoot()` the seed loader becomes a no-op
      // and the panel doesn't appear anywhere. Every platform
      // variant (WebStorageModule / NativeStorageModule) transitively
      // inherits this contribution via its own `imports:
      // [StorageModule.forRoot(...)]`.
      imports: [DevtoolsModule.forFeature([StorageDevtoolsPanel])],
      providers: [
        // Resolved config — used by StorageManager to know which
        // instances to hand out and which is default.
        { provide: STORAGE_CONFIG, useValue: config },
        // The manager itself under its class token, then aliased to
        // the contract symbol so both `@Inject(StorageManager)` and
        // `@Inject(STORAGE_MANAGER)` work.
        StorageManager,
        { provide: STORAGE_MANAGER, useExisting: StorageManager },
        // The default IStorage instance — a shortcut for
        // manager.instance(config.default).
        {
          provide: STORAGE,
          useFactory: (manager: StorageManager): IStorage => manager.instance(),
          inject: [StorageManager],
        },
      ],
      exports: [STORAGE_CONFIG, STORAGE_MANAGER, STORAGE, StorageManager],
    };
  }

  /**
   * Register the storage module globally with async configuration.
   *
   * Use when the config depends on runtime services (e.g., a
   * `ConfigService`) and cannot be resolved synchronously at module
   * definition time.
   *
   * @param options - Async options containing `useFactory` (returning
   *   the storage options) and optional `inject` for factory args.
   * @returns A `DynamicModule` with the same bindings as
   *   {@link forRoot}.
   *
   * @example
   * ```typescript
   * StorageModule.forRootAsync({
   *   inject: [ConfigService],
   *   useFactory: (cfg: ConfigService) => ({
   *     default: cfg.get('STORAGE_DEFAULT'),
   *     stores: cfg.get('STORAGE_STORES'),
   *   }),
   * });
   * ```
   */
  public static forRootAsync(options: IAsyncModuleOptions<IStorageModuleOptions>): DynamicModule {
    return {
      module: StorageModule,
      global: true,
      imports: [
        ...(options.imports ?? []),
        // Devtools storage panel — see forRoot for the fail-soft rationale.
        DevtoolsModule.forFeature([StorageDevtoolsPanel]),
      ],
      providers: [
        {
          provide: STORAGE_CONFIG,
          useFactory: async (...args: unknown[]) => mergeConfig(await options.useFactory(...args)),
          inject: options.inject ?? [],
        },
        StorageManager,
        { provide: STORAGE_MANAGER, useExisting: StorageManager },
        {
          provide: STORAGE,
          useFactory: (manager: StorageManager): IStorage => manager.instance(),
          inject: [StorageManager],
        },
      ],
      exports: [STORAGE_CONFIG, STORAGE_MANAGER, STORAGE, StorageManager],
    };
  }
}
