/**
 * @file index.ts
 * @module @academorix/query/laravel
 *
 * @description
 * Public barrel for the Laravel query-builder serialiser. Consumed by
 * both {@link "@academorix/query/refine"} (bundles it into a Refine
 * `DataProvider`) and any application code that wants to talk to a
 * spatie/laravel-query-builder v7 backend directly.
 */

export { serializeLaravelQuery } from "./serialize-laravel-query.util";
export type {
  LaravelConditionalFilter,
  LaravelFilter,
  LaravelFilterOperator,
  LaravelListPagination,
  LaravelLogicalFilter,
  LaravelQueryInput,
  LaravelSortOrder,
  LaravelSorter,
} from "./laravel-query.type";
