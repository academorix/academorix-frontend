/**
 * @file web-storage.module.ts
 * @module @stackra/storage/react
 * @description DI module that imports `StorageModule.forRoot(options)`
 *   and registers the three browser drivers (`localStorage`,
 *   `sessionStorage`, `indexedDB`) on the resolved `StorageManager`
 *   via `manager.extend(...)`. Consumers who don't need one of the
 *   three simply omit it from their `stores` config — the extend
 *   call is a no-op registration cost.
 */

import { Global, Module, type DynamicModule } from "@stackra/container";
import { createSeedLoader, seedLoaderToken } from "@stackra/support";
import type { IStorageModuleOptions, IStorageStoreConfig } from "@stackra/contracts";

import { StorageModule } from "@/core/storage.module";
import { StorageManager } from "@/core/services/storage-manager.service";

import { CookieStore } from "./stores/cookie.store";
import { LocalStorageStore } from "./stores/local-storage.store";
import { SessionStorageStore } from "./stores/session-storage.store";
import { IndexedDbStore } from "./stores/indexed-db.store";

/**
 * Pull an optional string field out of a raw store-config record
 * without letting a mistyped value crash driver construction.
 */
function readString(config: Record<string, unknown>, key: string): string | undefined {
  const raw = config[key];
  return typeof raw === "string" ? raw : undefined;
}

/**
 * Derive the effective key prefix for a browser-storage driver.
 *
 * Precedence: explicit `prefix` → the manager-supplied instance name
 * → empty string.
 */
function derivePrefix(config: Record<string, unknown>): string {
  return readString(config, "prefix") ?? readString(config, "__instanceName") ?? "";
}

/**
 * Web-flavoured storage module. Import this INSTEAD of
 * `StorageModule.forRoot(...)` in a browser app.
 *
 * Behaviour:
 *
 * - Imports `StorageModule.forRoot(options)` so `STORAGE_MANAGER`,
 *   `STORAGE_CONFIG`, and `STORAGE` are all bound.
 * - Registers `localStorage`, `sessionStorage`, `indexedDB`, and
 *   `cookie` drivers on the manager via `manager.extend(...)` inside
 *   a `createSeedLoader` provider (so registration runs in the
 *   `onApplicationBootstrap` phase — never as a side-effecting
 *   factory).
 *
 * @example
 * ```typescript
 * import { WebStorageModule } from '@stackra/storage/react';
 *
 * @Module({
 *   imports: [
 *     WebStorageModule.forRoot({
 *       default: 'preferences',
 *       stores: {
 *         preferences: { driver: 'localStorage', prefix: 'app:prefs' },
 *         session: { driver: 'sessionStorage' },
 *         offline: { driver: 'indexedDB', database: 'app-offline' },
 *       },
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Global()
@Module({})
export class WebStorageModule {
  /**
   * Register the storage manager + web drivers globally.
   *
   * @param options - Storage config forwarded to
   *   `StorageModule.forRoot(options)`. Optional — omitting the
   *   argument yields the same `memory`-only default the core module
   *   ships.
   * @returns A `DynamicModule` importing the core module and adding
   *   a seed loader that registers the three web drivers.
   */
  public static forRoot(options?: IStorageModuleOptions): DynamicModule {
    return {
      module: WebStorageModule,
      global: true,
      imports: [StorageModule.forRoot(options)],
      providers: [
        {
          provide: seedLoaderToken("storage:web-drivers"),
          useFactory: (manager: StorageManager) =>
            createSeedLoader(() => {
              manager.extend("localStorage", (config) => {
                return new LocalStorageStore({ prefix: derivePrefix(config) });
              });

              manager.extend("sessionStorage", (config) => {
                return new SessionStorageStore({ prefix: derivePrefix(config) });
              });

              manager.extend("indexedDB", (config) => {
                const scoped = config as unknown as IStorageStoreConfig;
                return new IndexedDbStore({
                  ...(readString(config, "database")
                    ? { database: readString(config, "database") as string }
                    : {}),
                  ...(readString(config, "tableName")
                    ? { tableName: readString(config, "tableName") as string }
                    : {}),
                  // Reference `scoped` so the linter doesn't strip the
                  // downcast (kept for future prefix / index support).
                  ...(scoped as object),
                });
              });

              manager.extend("cookie", (config) => {
                // Cookie config accepts optional overrides —
                // `maxAge`, `path`, `domain`, `sameSite`, `secure`.
                // `sameSite` is narrowed to the literal union on
                // access so downstream drivers get a well-typed
                // constructor argument.
                const sameSiteRaw = readString(config, "sameSite");
                const sameSite: "Strict" | "Lax" | "None" | undefined =
                  sameSiteRaw === "Strict" || sameSiteRaw === "Lax" || sameSiteRaw === "None"
                    ? sameSiteRaw
                    : undefined;
                const maxAgeRaw = config["maxAge"];
                const maxAge = typeof maxAgeRaw === "number" ? maxAgeRaw : undefined;
                const secureRaw = config["secure"];
                const secure = typeof secureRaw === "boolean" ? secureRaw : undefined;
                return new CookieStore({
                  prefix: derivePrefix(config),
                  ...(readString(config, "path")
                    ? { path: readString(config, "path") as string }
                    : {}),
                  ...(readString(config, "domain")
                    ? { domain: readString(config, "domain") as string }
                    : {}),
                  ...(sameSite ? { sameSite } : {}),
                  ...(maxAge !== undefined ? { maxAge } : {}),
                  ...(secure !== undefined ? { secure } : {}),
                });
              });
            }),
          inject: [StorageManager],
        },
      ],
    };
  }
}
