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
 *  - {@link "@academorix/query/laravel"} — `serializeLaravelQuery()`
 *    that turns Refine-style `{ pagination, sorters, filters, include }`
 *    into a `URLSearchParams` matching spatie/laravel-query-builder
 *    v7's wire format.
 *  - {@link "@academorix/query/refine"} —
 *    `createRefineRestDataProvider()` — the dashboard's Refine
 *    `DataProvider` bound to an `@academorix/http` `HttpClient`.
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

export { serializeLaravelQuery } from "./laravel";
export type {
  LaravelConditionalFilter,
  LaravelFilter,
  LaravelFilterOperator,
  LaravelListPagination,
  LaravelLogicalFilter,
  LaravelQueryInput,
  LaravelSortOrder,
  LaravelSorter,
} from "./laravel";

export { createRefineRestDataProvider } from "./refine";
export type {
  BaseRecord as RefineBaseRecord,
  CreateRefineRestDataProviderOptions,
  RefineDataProvider,
} from "./refine";
