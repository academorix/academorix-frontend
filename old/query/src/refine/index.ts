/**
 * @file index.ts
 * @module @academorix/query/refine
 *
 * @description
 * Public barrel for the Refine `DataProvider` adapter. Consumed by the
 * dashboard's `<Refine dataProvider={...}>`. Not used by the landing
 * page — that surface uses `defineResource` from
 * {@link "@academorix/query/resource"} directly.
 *
 * ## Why structural (not `@refinedev/core`-typed)
 *
 * This package must not import `@refinedev/core` so it can be reused
 * from surfaces that don't ship Refine (landing, admin). The
 * {@link RefineDataProvider} type is a structural mirror of Refine
 * v5's `DataProvider` — the returned provider is directly assignable
 * to `<Refine dataProvider={...}>` at the call site without a cast.
 */

export { createRefineRestDataProvider } from "./create-refine-rest-data-provider";
export type { CreateRefineRestDataProviderOptions } from "./create-refine-rest-data-provider";
export type {
  HttpClientLike,
  HttpClientMethod,
  HttpClientRequestOptions,
} from "./http-client.type";
export type {
  BaseKey,
  BaseRecord,
  ConditionalFilter,
  CreateParams,
  CrudFilter,
  CrudFilters,
  CrudOperators,
  CrudSort,
  CrudSorting,
  CustomParams,
  CustomResponse,
  DataItemResponse,
  DataListResponse,
  DeleteOneParams,
  GetListParams,
  GetListResponse,
  GetManyParams,
  GetOneParams,
  LogicalFilter,
  MetaQuery,
  Pagination,
  RefineDataProvider,
  SortOrder,
  UpdateParams,
} from "./data-provider.type";
