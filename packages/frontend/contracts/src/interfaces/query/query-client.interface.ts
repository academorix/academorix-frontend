/**
 * @file query-client.interface.ts
 * @module @stackra/contracts/interfaces/query
 * @description The cross-package query client contract.
 *
 *   Implemented by `QueryService` in `@stackra/query` (which wraps
 *   `@tanstack/query-core`'s `QueryClient`). Consumers inject
 *   `QUERY_CLIENT` to trigger fetches, invalidate cached data, and
 *   inspect the cache from non-React contexts — action handlers,
 *   SSR loaders, tests, background workers.
 *
 *   Mirrors the surface of TanStack Query's `QueryClient` methods
 *   we actually use, one-to-one, so the semantics are the same
 *   ones documented at https://tanstack.com/query/latest.
 */

/**
 * Minimal query client surface — the cross-package escape hatch for
 * non-React callers.
 *
 * Every method delegates to `@tanstack/query-core`:
 *   - `fetch`      → `queryClient.fetchQuery`
 *   - `invalidate` → `queryClient.invalidateQueries`
 *   - `refetch`    → `queryClient.refetchQueries`
 *   - `getData`    → `queryClient.getQueryData`
 *   - `setData`    → `queryClient.setQueryData`
 *   - `remove`     → `queryClient.removeQueries`
 *   - `keys`       → walks the query cache
 */
export interface IQueryClient {
  /**
   * Fetch data under `key`, using `fetcher` when the cache is empty
   * or stale. Caches the result in TanStack Query's query cache;
   * subsequent calls with the same key + fresh stale-window return
   * the cached value.
   *
   * @typeParam T - Fetcher return shape.
   * @param key     - Stable query key (e.g. `['themes']`).
   * @param fetcher - Async fetcher invoked on cache miss / stale.
   * @param options - Optional per-fetch options (`staleTime`).
   * @returns The fetched data.
   */
  fetch<T = unknown>(
    key: readonly unknown[],
    fetcher: () => Promise<T>,
    options?: { readonly staleTime?: number },
  ): Promise<T>;

  /**
   * Invalidate every query whose key matches (or is a prefix of)
   * `key`. Active queries are refetched immediately; inactive
   * queries are marked stale and refetch on next mount.
   */
  invalidate(key: readonly unknown[]): Promise<void>;

  /**
   * Force-refetch every query matching `key`, regardless of
   * staleness. Returns the fresh data.
   */
  refetch<T = unknown>(key: readonly unknown[]): Promise<T | undefined>;

  /** Read cached data. Returns `undefined` when no query is cached. */
  getData<T = unknown>(key: readonly unknown[]): T | undefined;

  /**
   * Set cached data imperatively. Useful for optimistic mutations
   * and hydrating from SSR.
   */
  setData<T = unknown>(key: readonly unknown[], data: T): void;

  /** Remove the query from the cache. */
  remove(key: readonly unknown[]): void;

  /** Every currently-cached query key in insertion order. */
  keys(): ReadonlyArray<readonly unknown[]>;
}
