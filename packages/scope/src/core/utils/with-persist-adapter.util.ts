/**
 * @file with-persist-adapter.util.ts
 * @module @stackra/scope/core/utils
 * @description Compose an `IScopePersistAdapter` onto an `IScopeDataSource`
 *   so the adapter's `persist(nodeId)` fires alongside the user's own
 *   `dataSource.persist(scope)`.
 *
 *   Used by `NativeScopeModule` to wire AsyncStorage persistence around
 *   the app-provided data source without the app author having to
 *   remember to call `adapter.persist(...)` inside every `persist`
 *   implementation.
 */

import type { IScopeDataSource } from '../interfaces/scope-data-source.interface';
import type { IScopePersistAdapter } from '../interfaces/scope-persist-adapter.interface';

/**
 * Wrap a data source so its `persist(scope)` also invokes the persist
 * adapter with the node id. Preserves every other method by reference.
 *
 * The wrapper's `persist` first delegates to the underlying data source
 * (if it defined one) and then fires the adapter — so an app that
 * already writes to a remote user-prefs endpoint in its own `persist`
 * keeps that behaviour AND picks up local AsyncStorage persistence for
 * free. Adapter errors are fail-soft; the adapter contract already
 * requires that.
 *
 * @example
 * ```typescript
 * import { withPersistAdapter } from '@stackra/scope';
 * import { AsyncStorageScopePersistAdapter } from '@stackra/scope/native';
 *
 * const wrapped = withPersistAdapter(new HttpScopeDataSource(api),
 *                                    new AsyncStorageScopePersistAdapter());
 * ScopeModule.forRoot({ dataSource: wrapped });
 * ```
 */
export function withPersistAdapter(
  dataSource: IScopeDataSource,
  adapter: IScopePersistAdapter
): IScopeDataSource {
  return {
    resolveScope: dataSource.resolveScope.bind(dataSource),
    loadTree: dataSource.loadTree.bind(dataSource),
    // `resolveValue` and `persist` are optional on the contract — only
    // forward the property when the underlying source actually defines
    // it, so `hasOwnProperty` checks and duck-typing still work.
    ...(dataSource.resolveValue ? { resolveValue: dataSource.resolveValue.bind(dataSource) } : {}),
    persist(scope) {
      // Run the original persist first so the caller's side effect wins
      // (e.g., a remote write completes before the local write starts).
      dataSource.persist?.(scope);
      // Adapter is fail-soft by contract — fire-and-forget the write.
      void adapter.persist(scope.nodeId);
    },
  };
}
