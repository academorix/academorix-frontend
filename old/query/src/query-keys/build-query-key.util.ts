/**
 * @file build-query-key.util.ts
 * @module @academorix/query/query-keys/build-query-key.util
 *
 * @description
 * Canonical shape for React Query cache keys used by the workspace.
 *
 * Every key is a tuple whose first three positions identify the
 * resource + operation:
 *
 *   `[prefix, resourcePath, operation, ...params]`
 *
 * - `prefix` — namespace to avoid collisions across integrations
 *   (`"@academorix"` by default).
 * - `resourcePath` — the resource's REST path (e.g. `"athletes"`).
 * - `operation` — one of `"list" | "one" | "many"`.
 * - `...params` — operation-specific: filters + sorters + page for
 *   lists, id for one, ids-array for many.
 *
 * ## Cache invalidation
 *
 * Prefix-match invalidation is easy because React Query walks the
 * key tuple left-to-right:
 *
 *  - Invalidate every list for a resource:
 *    `queryClient.invalidateQueries({ queryKey: [prefix, path, "list"] })`.
 *  - Invalidate one specific record:
 *    `queryClient.invalidateQueries({ queryKey: [prefix, path, "one", id] })`.
 *  - Invalidate everything for a resource:
 *    `queryClient.invalidateQueries({ queryKey: [prefix, path] })`.
 */

/** Default namespace applied when no explicit prefix is passed. */
export const DEFAULT_QUERY_KEY_PREFIX = "@academorix";

/** Operation the key represents. */
export type ResourceOperation = "list" | "one" | "many";

/**
 * Assembles a resource query key from its parts. Prefer the
 * specialized `listKey` / `oneKey` / `manyKey` helpers at call sites
 * for readability.
 */
export function buildQueryKey(
  prefix: string,
  path: string,
  operation: ResourceOperation,
  ...params: readonly unknown[]
): readonly unknown[] {
  return [prefix, path, operation, ...params];
}

/**
 * Key for a paginated / filtered list query.
 *
 * @param prefix - Namespace (usually `DEFAULT_QUERY_KEY_PREFIX`).
 * @param path - Resource path (`"athletes"`, `"teams"`, ...).
 * @param params - Optional list params (filter/sort/page). MUST be
 *   serialisable so React Query's deep-compare treats identical
 *   params as the same key.
 */
export function listKey(
  prefix: string,
  path: string,
  params?: Record<string, unknown>,
): readonly unknown[] {
  return params ? [prefix, path, "list", params] : [prefix, path, "list"];
}

/**
 * Key for a single-record query.
 *
 * @param id - The record's primary key. Coerced to string so `"1"` and
 *   `1` don't produce two cache entries.
 */
export function oneKey(prefix: string, path: string, id: string | number): readonly unknown[] {
  return [prefix, path, "one", String(id)];
}

/**
 * Key for a batch-read query (`getMany`) — the ids are sorted before
 * hashing so `[1, 2]` and `[2, 1]` collapse to one cache entry.
 */
export function manyKey(
  prefix: string,
  path: string,
  ids: readonly (string | number)[],
): readonly unknown[] {
  const sorted = [...ids].map(String).sort();

  return [prefix, path, "many", sorted];
}
