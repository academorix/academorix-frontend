/**
 * @file index.ts
 * @module @academorix/query
 *
 * @description
 * Public root barrel. Prefer subpath imports for tree-shaking.
 *
 * ## Public API
 *
 *  - {@link "@academorix/query/client"} — `createQueryClient(options)`
 *    QueryClient factory with Academorix-flavored defaults.
 *  - {@link "@academorix/query/resource"} — `defineResource<TRecord>()`
 *    factory that generates typed `useList / useOne / useCreate /
 *    useUpdate / useDelete` hooks.
 *  - {@link "@academorix/query/query-keys"} — canonical query-key
 *    helpers (`listKey`, `oneKey`, `manyKey`) for downstream
 *    invalidation.
 */

export { createQueryClient } from "./client";
export type { CreateQueryClientOptions } from "./client";

export { defineResource, serializeListParams } from "./resource";
export type {
  DefineResourceOptions,
  ResourceDefinition,
  ResourceHooks,
  ResourceListParams,
  ResourceListResult,
} from "./resource";

export { buildQueryKey, DEFAULT_QUERY_KEY_PREFIX, listKey, manyKey, oneKey } from "./query-keys";
export type { ResourceOperation } from "./query-keys";
