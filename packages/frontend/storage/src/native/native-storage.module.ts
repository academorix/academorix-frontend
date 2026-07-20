/**
 * @file native-storage.module.ts
 * @module @stackra/storage/native
 * @description DI module that imports `StorageModule.forRoot(options)`
 *   and registers the React Native `asyncStorage` driver on the
 *   resolved `StorageManager` via `manager.extend(...)`.
 */

import { Global, Module, type DynamicModule } from "@stackra/container";
import { createSeedLoader, seedLoaderToken } from "@stackra/support";
import type { IStorageModuleOptions } from "@stackra/contracts";

import { StorageModule } from "@/core/storage.module";
import { StorageManager } from "@/core/services/storage-manager.service";

import { AsyncStorageStore } from "./stores/async-storage.store";

/** Read an optional string field from a raw store-config record. */
function readString(config: Record<string, unknown>, key: string): string | undefined {
  const raw = config[key];
  return typeof raw === "string" ? raw : undefined;
}

/**
 * Derive the effective key prefix for a native driver. Precedence:
 * explicit `prefix` → manager-supplied instance name → empty string.
 */
function derivePrefix(config: Record<string, unknown>): string {
  return readString(config, "prefix") ?? readString(config, "__instanceName") ?? "";
}

/**
 * Native-flavoured storage module. Import this INSTEAD of
 * `StorageModule.forRoot(...)` in a React Native app.
 *
 * Behaviour:
 *
 * - Imports `StorageModule.forRoot(options)` so `STORAGE_MANAGER`,
 *   `STORAGE_CONFIG`, and `STORAGE` are all bound.
 * - Registers the `asyncStorage` driver on the manager via
 *   `manager.extend(...)` inside a `createSeedLoader` provider (so
 *   registration runs in the `onApplicationBootstrap` phase — never
 *   as a side-effecting factory).
 *
 * @example
 * ```typescript
 * import { NativeStorageModule } from '@stackra/storage/native';
 *
 * @Module({
 *   imports: [
 *     NativeStorageModule.forRoot({
 *       default: 'preferences',
 *       stores: {
 *         preferences: { driver: 'asyncStorage', prefix: 'app:prefs' },
 *       },
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Global()
@Module({})
export class NativeStorageModule {
  /**
   * Register the storage manager + native driver globally.
   *
   * @param options - Storage config forwarded to
   *   `StorageModule.forRoot(options)`. Optional — omitting the
   *   argument yields the `memory`-only default.
   * @returns A `DynamicModule` importing the core module and adding
   *   a seed loader that registers `asyncStorage`.
   */
  public static forRoot(options?: IStorageModuleOptions): DynamicModule {
    return {
      module: NativeStorageModule,
      global: true,
      imports: [StorageModule.forRoot(options)],
      providers: [
        {
          provide: seedLoaderToken("storage:native-drivers"),
          useFactory: (manager: StorageManager) =>
            createSeedLoader(() => {
              manager.extend("asyncStorage", (config) => {
                return new AsyncStorageStore({ prefix: derivePrefix(config) });
              });
            }),
          inject: [StorageManager],
        },
      ],
    };
  }
}
