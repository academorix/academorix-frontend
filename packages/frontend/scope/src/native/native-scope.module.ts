/**
 * @file native-scope.module.ts
 * @module @stackra/scope/native
 * @description React Native alias of `ScopeModule.forRoot` — kept for
 *   backward compatibility.
 *
 *   Prior versions of the package shipped an
 *   `AsyncStorageScopePersistAdapter` and wired it here. Since v0.2 the
 *   adapter layer is unified — scope persistence is delegated to
 *   `@stackra/storage`. Apps import `NativeStorageModule.forRoot(...)`
 *   with an `asyncStorage` instance and then pass
 *   `storage: 'asyncStorage'` to `ScopeModule.forRoot`.
 *
 *   For zero-config compatibility, this alias defaults
 *   `storage` to `'asyncStorage'` when the caller doesn't provide one
 *   and doesn't pass an explicit `persistAdapter`.
 */

import { Module, type DynamicModule } from "@stackra/container";

import { ScopeModule, type ScopeRootOptions } from "@/core/scope.module";
import { withPersistAdapter } from "@/core/utils/with-persist-adapter.util";
import type { IScopePersistAdapter } from "@/core/interfaces";

/** Options accepted by `NativeScopeModule.forRoot`. */
export interface NativeScopeRootOptions extends ScopeRootOptions {
  /**
   * Explicit persist adapter to wrap the data source with. Preserved
   * for backward compatibility — new code should set
   * `storage: 'asyncStorage'` (or any instance name) on
   * `ScopeModule.forRoot` directly.
   *
   * - `undefined` (default) → forwards to `ScopeModule.forRoot` with
   *   `storage` defaulted to `'asyncStorage'`.
   * - `false` → no persistence.
   * - An adapter instance → wraps the data source with it directly,
   *   bypassing `@stackra/storage`.
   */
  readonly persistAdapter?: IScopePersistAdapter | false;
}

/**
 * Backward-compatible native scope module.
 *
 * @deprecated Use `ScopeModule.forRoot({ storage: 'asyncStorage', ... })`
 *   directly. Kept for callers that already import
 *   `NativeScopeModule`.
 */
@Module({})
export class NativeScopeModule {
  /**
   * Register the scope module. See {@link NativeScopeRootOptions}
   * for the compatibility surface.
   *
   * @param options - Options forwarded to `ScopeModule.forRoot`.
   * @returns The `ScopeModule.forRoot(options)` dynamic module.
   */
  public static forRoot(options: NativeScopeRootOptions = {}): DynamicModule {
    const { persistAdapter, dataSource, ...rest } = options;

    // Explicit `persistAdapter: false` → opt out of persistence.
    if (persistAdapter === false) {
      return {
        module: NativeScopeModule,
        global: true,
        imports: [
          ScopeModule.forRoot({
            ...rest,
            storage: "memory",
            ...(dataSource ? { dataSource } : {}),
          }),
        ],
        providers: [],
        exports: [],
      };
    }

    // Explicit adapter instance — preserve legacy behaviour by
    // wrapping the data source directly and bypassing the
    // storage-manager machinery.
    if (persistAdapter) {
      const wrappedDataSource = dataSource
        ? withPersistAdapter(dataSource, persistAdapter)
        : dataSource;
      return {
        module: NativeScopeModule,
        global: true,
        imports: [
          ScopeModule.forRoot({
            ...rest,
            // Explicit `'memory'` so the core module skips its own
            // storage-backed wiring — the caller already provided one.
            storage: "memory",
            ...(wrappedDataSource ? { dataSource: wrappedDataSource } : {}),
          }),
        ],
        providers: [],
        exports: [],
      };
    }

    // Default path — delegate to the core module with a default
    // `storage: 'asyncStorage'` so the storage-backed adapter kicks in.
    // Caller can override by passing their own `storage` value.
    return {
      module: NativeScopeModule,
      global: true,
      imports: [
        ScopeModule.forRoot({
          storage: "asyncStorage",
          ...rest,
          ...(dataSource ? { dataSource } : {}),
        }),
      ],
      providers: [],
      exports: [],
    };
  }
}
