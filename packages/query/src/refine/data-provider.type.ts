/**
 * @file data-provider.type.ts
 * @module @academorix/query/refine/data-provider.type
 *
 * @description
 * Structural types mirroring Refine v5's `DataProvider` interface so
 * this package doesn't have to depend on `@refinedev/core`.
 *
 * The shape below is a strict superset of what
 * {@link https://refine.dev/docs/data/data-provider/ Refine v5} emits
 * — every field is `readonly` where practical, and unions/parameter
 * types match the upstream signatures. Consumers can pass the return
 * of {@link createRefineRestDataProvider} directly into
 * `<Refine dataProvider={...}>` without a cast.
 *
 * Kept in sync with `@refinedev/core@^5` — if Refine's `DataProvider`
 * contract changes (rare), the mirror here must be updated too.
 */

/** Primary-key type Refine understands. */
export type BaseKey = string | number;

/**
 * Refine v5's `BaseRecord`. Every record surface is expected to carry
 * an optional `id` — Refine indexes cache entries by it.
 */
export interface BaseRecord {
  readonly id?: BaseKey;
  readonly [key: string]: unknown;
}

/** Refine v5's `Pagination`. Matches {@link LaravelListPagination}. */
export interface Pagination {
  readonly currentPage?: number;
  readonly pageSize?: number;
  readonly mode?: "client" | "server" | "off";
}

/** The full operator set Refine v5's `LogicalFilter` accepts. */
export type CrudOperators =
  | "eq"
  | "ne"
  | "eqs"
  | "nes"
  | "lt"
  | "gt"
  | "lte"
  | "gte"
  | "in"
  | "nin"
  | "ina"
  | "nina"
  | "contains"
  | "ncontains"
  | "containss"
  | "ncontainss"
  | "between"
  | "nbetween"
  | "null"
  | "nnull"
  | "startswith"
  | "nstartswith"
  | "startswiths"
  | "nstartswiths"
  | "endswith"
  | "nendswith"
  | "endswiths"
  | "nendswiths"
  | "or"
  | "and";

/** Sort direction for a single field. */
export type SortOrder = "desc" | "asc" | null;

/** Refine v5's `LogicalFilter`. */
export interface LogicalFilter {
  readonly field: string;
  readonly operator: Exclude<CrudOperators, "or" | "and">;
  readonly value: unknown;
}

/** Refine v5's `ConditionalFilter`. */
export interface ConditionalFilter {
  readonly key?: string;
  readonly operator: Extract<CrudOperators, "or" | "and">;
  readonly value: readonly (LogicalFilter | ConditionalFilter)[];
}

/** Refine v5's `CrudFilter` — union of logical + conditional. */
export type CrudFilter = LogicalFilter | ConditionalFilter;

/** Refine v5's `CrudSort`. */
export interface CrudSort {
  readonly field: string;
  readonly order: "asc" | "desc";
}

/** Refine v5's `CrudFilters`. */
export type CrudFilters = readonly CrudFilter[];

/** Refine v5's `CrudSorting`. */
export type CrudSorting = readonly CrudSort[];

/**
 * Refine v5's `MetaQuery`. Free-form record; every implementation
 * reads its own subset. This provider consumes `headers` and
 * `include`.
 */
export interface MetaQuery {
  readonly headers?: Record<string, string>;
  readonly include?: readonly string[];
  readonly [key: string]: unknown;
}

/** Refine v5's response shapes. */
export interface GetListResponse<TData extends BaseRecord = BaseRecord> {
  readonly data: readonly TData[];
  readonly total: number;
  readonly [key: string]: unknown;
}

/** Wraps a single-record read/mutation response. */
export interface DataItemResponse<TData extends BaseRecord = BaseRecord> {
  readonly data: TData;
}

/** Wraps a many-record read response. */
export interface DataListResponse<TData extends BaseRecord = BaseRecord> {
  readonly data: readonly TData[];
}

/** Wraps a `custom()` call's response. */
export interface CustomResponse<TData = BaseRecord> {
  readonly data: TData;
}

/** Params accepted by `getList`. */
export interface GetListParams {
  readonly resource: string;
  readonly pagination?: Pagination;
  readonly sorters?: CrudSorting;
  readonly filters?: CrudFilters;
  readonly meta?: MetaQuery;
  readonly dataProviderName?: string;
}

/** Params accepted by `getMany`. */
export interface GetManyParams {
  readonly resource: string;
  readonly ids: readonly BaseKey[];
  readonly meta?: MetaQuery;
  readonly dataProviderName?: string;
}

/** Params accepted by `getOne`. */
export interface GetOneParams {
  readonly resource: string;
  readonly id: BaseKey;
  readonly meta?: MetaQuery;
}

/** Params accepted by `create`. */
export interface CreateParams<TVariables = Record<string, unknown>> {
  readonly resource: string;
  readonly variables: TVariables;
  readonly meta?: MetaQuery;
}

/** Params accepted by `update`. */
export interface UpdateParams<TVariables = Record<string, unknown>> {
  readonly resource: string;
  readonly id: BaseKey;
  readonly variables: TVariables;
  readonly meta?: MetaQuery;
}

/** Params accepted by `deleteOne`. */
export interface DeleteOneParams<TVariables = Record<string, unknown>> {
  readonly resource: string;
  readonly id: BaseKey;
  readonly variables?: TVariables;
  readonly meta?: MetaQuery;
}

/** Params accepted by `custom`. */
export interface CustomParams<TQuery = unknown, TPayload = unknown> {
  readonly url: string;
  readonly method: "get" | "delete" | "head" | "options" | "post" | "put" | "patch";
  readonly sorters?: CrudSorting;
  readonly filters?: CrudFilters;
  readonly payload?: TPayload;
  readonly query?: TQuery;
  readonly headers?: Record<string, string>;
  readonly meta?: MetaQuery;
}

/**
 * Structural shape of Refine's `DataProvider` — a mirror of
 * `@refinedev/core`'s `DataProvider` type. Kept intentionally
 * `readonly` so implementers can't mutate the surface after creation,
 * and so the return value of {@link createRefineRestDataProvider} is
 * directly assignable to Refine's non-readonly type at the call site.
 */
export interface RefineDataProvider {
  /** Fetches a paginated + filtered + sorted list. */
  readonly getList: <TData extends BaseRecord = BaseRecord>(
    params: GetListParams,
  ) => Promise<GetListResponse<TData>>;

  /** Fetches many records by id in a single round-trip. Optional in v5. */
  readonly getMany?: <TData extends BaseRecord = BaseRecord>(
    params: GetManyParams,
  ) => Promise<DataListResponse<TData>>;

  /** Fetches a single record by id. */
  readonly getOne: <TData extends BaseRecord = BaseRecord>(
    params: GetOneParams,
  ) => Promise<DataItemResponse<TData>>;

  /** Creates a new record. */
  readonly create: <TData extends BaseRecord = BaseRecord, TVariables = Record<string, unknown>>(
    params: CreateParams<TVariables>,
  ) => Promise<DataItemResponse<TData>>;

  /** Updates a record by id. */
  readonly update: <TData extends BaseRecord = BaseRecord, TVariables = Record<string, unknown>>(
    params: UpdateParams<TVariables>,
  ) => Promise<DataItemResponse<TData>>;

  /** Deletes a record by id. */
  readonly deleteOne: <TData extends BaseRecord = BaseRecord, TVariables = Record<string, unknown>>(
    params: DeleteOneParams<TVariables>,
  ) => Promise<DataItemResponse<TData>>;

  /** Returns the base API URL Refine surfaces via `useApiUrl()`. */
  readonly getApiUrl: () => string;

  /**
   * Escape hatch for endpoints that don't fit `getList` / `getOne` /
   * `create` / `update` / `deleteOne`. Optional in v5.
   */
  readonly custom?: <TData extends BaseRecord = BaseRecord, TQuery = unknown, TPayload = unknown>(
    params: CustomParams<TQuery, TPayload>,
  ) => Promise<CustomResponse<TData>>;
}
