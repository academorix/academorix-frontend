/**
 * @file create-refine-rest-data-provider.ts
 * @module @academorix/query/refine/create-refine-rest-data-provider
 *
 * @description
 * Refine `DataProvider` backed by an `@academorix/http` `HttpClient` and
 * the {@link serializeLaravelQuery} wire format.
 *
 * It adapts between two shapes:
 *  - **Outgoing:** Refine's `pagination` / `sorters` / `filters` →
 *    {@link serializeLaravelQuery} query string.
 *  - **Incoming:** Laravel API Resource envelopes (`{ data }` for one
 *    record, `{ data, meta }` for a page) → Refine's flat
 *    `{ data, total }`.
 *
 * Every method is defensive about the envelope: if a bare array or
 * bare object comes back (e.g. from a hand-rolled endpoint that skips
 * API Resources), the shape is still handled correctly.
 *
 * ## `meta` forwarding
 *
 * Every method reads two optional fields from Refine's `meta`:
 *
 *  - `meta.headers` — merged into the outgoing request headers
 *    (per-request auth overrides, tenant switches, etc.).
 *  - `meta.include` — passed to {@link serializeLaravelQuery} to
 *    eager-load relations via spatie `AllowedInclude`.
 *
 * @example
 * ```ts
 * // apps/dashboard/src/providers/data/index.ts
 * import { createRefineRestDataProvider } from "@academorix/query/refine";
 * import { httpClient } from "@/lib/http";
 *
 * export const dataProvider = createRefineRestDataProvider(httpClient, {
 *   apiPrefix: "/v1",
 * });
 * ```
 */

import { serializeLaravelQuery } from "../laravel/serialize-laravel-query.util";

import type {
  BaseKey,
  BaseRecord,
  CustomParams,
  DataItemResponse,
  DataListResponse,
  CustomResponse,
  CreateParams,
  DeleteOneParams,
  GetListParams,
  GetListResponse,
  GetManyParams,
  GetOneParams,
  RefineDataProvider,
  UpdateParams,
} from "./data-provider.type";
import type { HttpClientLike, HttpClientMethod } from "./http-client.type";
import type {
  LaravelFilter,
  LaravelListPagination,
  LaravelSorter,
} from "../laravel/laravel-query.type";

/** Tuning knobs for {@link createRefineRestDataProvider}. */
export interface CreateRefineRestDataProviderOptions {
  /**
   * Path prefix prepended to every resource, e.g. `/api/v1` →
   * `/api/v1/students`. Versioning the API here keeps call sites
   * clean.
   *
   * The prefix is **also** appended to the transport's base URL when
   * {@link RefineDataProvider.getApiUrl} is called, so Refine
   * consumers see the same versioned origin as the raw requests.
   */
  readonly apiPrefix?: string;
}

/** Default API prefix — matches the workspace's canonical `/api/v1`. */
const DEFAULT_API_PREFIX = "/api/v1";

/**
 * Shape of a Laravel API Resource envelope for a single record.
 * Kept as a local type (rather than pulled from `@academorix/http`)
 * so `unwrapItem` stays isolated from the Foundation-envelope helpers.
 */
interface SingleResourceEnvelope<T> {
  data: T;
}

/**
 * Shape of a Laravel Resource Collection envelope for a paginated
 * list. `meta.total` is what Refine displays as the grand total.
 */
interface PaginatedResourceEnvelope<T> {
  data: readonly T[];
  meta?: {
    total?: number;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/**
 * Unwraps a single-resource envelope (`{ data }`) or a bare object.
 * Tolerates `undefined` bodies (204 responses) by passing them through.
 */
function unwrapItem<T>(response: unknown): T {
  if (response !== null && typeof response === "object" && "data" in response) {
    return (response as SingleResourceEnvelope<T>).data;
  }

  return response as T;
}

/**
 * Reads `meta.include` — Refine's convention for eager-load relations
 * — coercing to a `readonly string[]` when present.
 */
function extractInclude(meta: GetListParams["meta"]): readonly string[] | undefined {
  const include = meta?.include;

  return Array.isArray(include) ? (include as readonly string[]) : undefined;
}

/**
 * Reads `meta.headers` — per-request header overrides. Returned as a
 * plain `Record<string, string>` so it can flow through the HTTP
 * client's `headers` option directly.
 */
function extractHeaders(
  meta: { headers?: Record<string, string> } | undefined,
): Record<string, string> | undefined {
  return meta?.headers;
}

/**
 * Creates a Laravel-flavoured Refine `DataProvider` bound to the given
 * transport. Every method preserves the semantics documented on
 * {@link RefineDataProvider}.
 *
 * @param client - Any transport satisfying {@link HttpClientLike} —
 *   the workspace's `@academorix/http` `HttpClient` is the canonical
 *   fit.
 */
export function createRefineRestDataProvider(
  client: HttpClientLike,
  options: CreateRefineRestDataProviderOptions = {},
): RefineDataProvider {
  const apiPrefix = options.apiPrefix ?? DEFAULT_API_PREFIX;

  /** Collection path, e.g. `/api/v1/students`. */
  const pathFor = (resource: string): string => `${apiPrefix}/${resource}`;

  /** Single-record path, e.g. `/api/v1/students/{id}`. */
  const pathForId = (resource: string, id: BaseKey): string =>
    `${apiPrefix}/${resource}/${encodeURIComponent(String(id))}`;

  return {
    getApiUrl(): string {
      return `${client.getApiUrl()}${apiPrefix}`;
    },

    async getList<TData extends BaseRecord = BaseRecord>({
      resource,
      pagination,
      sorters,
      filters,
      meta,
    }: GetListParams): Promise<GetListResponse<TData>> {
      const include = extractInclude(meta);
      const searchParams = serializeLaravelQuery({
        pagination: pagination as LaravelListPagination | undefined,
        sorters: sorters as readonly LaravelSorter[] | undefined,
        filters: filters as readonly LaravelFilter[] | undefined,
        include,
      });

      const response = await client.get<PaginatedResourceEnvelope<TData> | readonly TData[]>(
        pathFor(resource),
        { searchParams, headers: extractHeaders(meta) },
      );

      // Bare array (non-paginated endpoint): total is the array length.
      if (Array.isArray(response)) {
        return { data: response, total: response.length };
      }

      const envelope = response as PaginatedResourceEnvelope<TData>;

      return {
        data: envelope.data,
        total: envelope.meta?.total ?? envelope.data.length,
      };
    },

    async getOne<TData extends BaseRecord = BaseRecord>({
      resource,
      id,
      meta,
    }: GetOneParams): Promise<DataItemResponse<TData>> {
      const response = await client.get<SingleResourceEnvelope<TData> | TData>(
        pathForId(resource, id),
        { headers: extractHeaders(meta) },
      );

      return { data: unwrapItem<TData>(response) };
    },

    async getMany<TData extends BaseRecord = BaseRecord>({
      resource,
      ids,
      meta,
    }: GetManyParams): Promise<DataListResponse<TData>> {
      // Fetch several records by id in one round-trip via `filter[id][in]=…`.
      const searchParams = new URLSearchParams();

      searchParams.set("filter[id][in]", ids.map((id) => String(id)).join(","));
      searchParams.set("per_page", String(ids.length || 1));

      const response = await client.get<PaginatedResourceEnvelope<TData> | readonly TData[]>(
        pathFor(resource),
        { searchParams, headers: extractHeaders(meta) },
      );

      return {
        data: Array.isArray(response)
          ? response
          : (response as PaginatedResourceEnvelope<TData>).data,
      };
    },

    async create<TData extends BaseRecord = BaseRecord, TVariables = Record<string, unknown>>({
      resource,
      variables,
      meta,
    }: CreateParams<TVariables>): Promise<DataItemResponse<TData>> {
      const response = await client.post<SingleResourceEnvelope<TData> | TData>(
        pathFor(resource),
        variables,
        { headers: extractHeaders(meta) },
      );

      return { data: unwrapItem<TData>(response) };
    },

    async update<TData extends BaseRecord = BaseRecord, TVariables = Record<string, unknown>>({
      resource,
      id,
      variables,
      meta,
    }: UpdateParams<TVariables>): Promise<DataItemResponse<TData>> {
      const response = await client.put<SingleResourceEnvelope<TData> | TData>(
        pathForId(resource, id),
        variables,
        { headers: extractHeaders(meta) },
      );

      return { data: unwrapItem<TData>(response) };
    },

    async deleteOne<TData extends BaseRecord = BaseRecord, TVariables = Record<string, unknown>>({
      resource,
      id,
      meta,
    }: DeleteOneParams<TVariables>): Promise<DataItemResponse<TData>> {
      // Laravel destroy actions typically return 204; `unwrapItem` tolerates
      // an empty body by passing `undefined` through as `TData`.
      const response = await client.delete<SingleResourceEnvelope<TData> | TData>(
        pathForId(resource, id),
        { headers: extractHeaders(meta) },
      );

      return { data: unwrapItem<TData>(response) };
    },

    async custom<TData extends BaseRecord = BaseRecord, TQuery = unknown, TPayload = unknown>({
      url,
      method,
      payload,
      query,
      filters,
      sorters,
      headers,
    }: CustomParams<TQuery, TPayload>): Promise<CustomResponse<TData>> {
      const searchParams = serializeLaravelQuery({
        filters: filters as readonly LaravelFilter[] | undefined,
        sorters: sorters as readonly LaravelSorter[] | undefined,
      });

      // Merge any explicit query record on top of filter/sorter-derived params
      // — the caller's `query` takes precedence so it can override anything
      // the filter/sorter pipeline emitted.
      if (query && typeof query === "object") {
        for (const [key, value] of Object.entries(query as Record<string, unknown>)) {
          searchParams.set(key, String(value));
        }
      }

      const data = await client.request<TData>(url, {
        method: method.toUpperCase() as HttpClientMethod,
        body: payload,
        searchParams,
        headers,
      });

      return { data };
    },
  };
}
