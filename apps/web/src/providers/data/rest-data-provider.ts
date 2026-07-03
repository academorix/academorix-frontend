/**
 * @file rest-data-provider.ts
 * @module providers/data/rest-data-provider
 *
 * @description
 * Refine `DataProvider` backed by the real Laravel REST API.
 *
 * It adapts between two shapes:
 * - **Outgoing:** Refine's `pagination`/`sorters`/`filters` →
 *   {@link buildListSearchParams} query string (see the list contract there).
 * - **Incoming:** Laravel API Resource envelopes (`{ data }` for one record,
 *   `{ data, meta, links }` for a page) → Refine's flat `{ data, total }`.
 *
 * Every method is defensive about the envelope: if a bare array or bare object
 * comes back (e.g. from a hand-rolled endpoint that skips API Resources), it is
 * still handled correctly.
 */

import type { HttpClient, HttpMethod } from "@/lib/http";
import type { ApiResource, LaravelPaginatedResponse } from "@/types/api";
import type { BaseRecord, DataProvider } from "@refinedev/core";

import { buildListSearchParams } from "@/lib/query/laravel-query";

/** Tuning knobs for {@link createRestDataProvider}. */
export interface RestDataProviderOptions {
  /**
   * Path prefix prepended to every resource, e.g. `/api/v1` →
   * `/api/v1/students`. Versioning the API here keeps call sites clean.
   */
  apiPrefix?: string;
}

const DEFAULT_API_PREFIX = "/api/v1";

/** Unwraps a single-resource envelope (`{ data }`) or a bare object. */
function unwrapItem<T>(response: ApiResource<T> | T): T {
  if (response && typeof response === "object" && "data" in response) {
    return (response as ApiResource<T>).data;
  }

  return response as T;
}

/**
 * Creates a Laravel-flavoured REST data provider bound to a given
 * {@link HttpClient}.
 *
 * @param client - The shared HTTP client (carries base URL + bearer token).
 * @param options - Optional API prefix override.
 */
export function createRestDataProvider(
  client: HttpClient,
  options: RestDataProviderOptions = {},
): DataProvider {
  const apiPrefix = options.apiPrefix ?? DEFAULT_API_PREFIX;

  /** Collection path, e.g. `/api/v1/students`. */
  const pathFor = (resource: string): string => `${apiPrefix}/${resource}`;

  /** Single-record path, e.g. `/api/v1/students/{id}`. */
  const pathForId = (resource: string, id: BaseRecord["id"]): string =>
    `${apiPrefix}/${resource}/${encodeURIComponent(String(id))}`;

  return {
    /** Returns the versioned API base URL. */
    getApiUrl(): string {
      return `${client.getApiUrl()}${apiPrefix}`;
    },

    async getList<TData extends BaseRecord = BaseRecord>({
      resource,
      pagination,
      sorters,
      filters,
      meta,
    }: Parameters<DataProvider["getList"]>[0]) {
      const include = Array.isArray(meta?.include) ? (meta.include as string[]) : undefined;
      const searchParams = buildListSearchParams({ pagination, sorters, filters, include });

      const response = await client.get<LaravelPaginatedResponse<TData> | TData[]>(
        pathFor(resource),
        { searchParams, headers: meta?.headers },
      );

      // Bare array (non-paginated endpoint): total is the array length.
      if (Array.isArray(response)) {
        return { data: response, total: response.length };
      }

      return {
        data: response.data,
        total: response.meta?.total ?? response.data.length,
      };
    },

    async getOne<TData extends BaseRecord = BaseRecord>({
      resource,
      id,
      meta,
    }: Parameters<DataProvider["getOne"]>[0]) {
      const response = await client.get<ApiResource<TData> | TData>(pathForId(resource, id), {
        headers: meta?.headers,
      });

      return { data: unwrapItem(response) };
    },

    async getMany<TData extends BaseRecord = BaseRecord>({
      resource,
      ids,
      meta,
    }: NonNullable<Parameters<NonNullable<DataProvider["getMany"]>>[0]>) {
      // Fetch several records by id in one round-trip via `filter[id][in]=…`.
      const searchParams = new URLSearchParams();

      searchParams.set("filter[id][in]", ids.map((id) => String(id)).join(","));
      searchParams.set("per_page", String(ids.length || 1));

      const response = await client.get<LaravelPaginatedResponse<TData> | TData[]>(
        pathFor(resource),
        { searchParams, headers: meta?.headers },
      );

      return { data: Array.isArray(response) ? response : response.data };
    },

    async create<TData extends BaseRecord = BaseRecord, TVariables = object>({
      resource,
      variables,
      meta,
    }: Parameters<DataProvider["create"]>[0] & { variables: TVariables }) {
      const response = await client.post<ApiResource<TData> | TData>(pathFor(resource), variables, {
        headers: meta?.headers,
      });

      return { data: unwrapItem(response) };
    },

    async update<TData extends BaseRecord = BaseRecord, TVariables = object>({
      resource,
      id,
      variables,
      meta,
    }: Parameters<DataProvider["update"]>[0] & { variables: TVariables }) {
      const response = await client.put<ApiResource<TData> | TData>(
        pathForId(resource, id),
        variables,
        { headers: meta?.headers },
      );

      return { data: unwrapItem(response) };
    },

    async deleteOne<TData extends BaseRecord = BaseRecord, TVariables = object>({
      resource,
      id,
      meta,
    }: Parameters<DataProvider["deleteOne"]>[0] & { variables?: TVariables }) {
      // Laravel destroy actions typically return 204; `unwrapItem` tolerates
      // an empty body by casting `undefined` through.
      const response = await client.delete<ApiResource<TData> | TData>(pathForId(resource, id), {
        headers: meta?.headers,
      });

      return { data: unwrapItem(response) };
    },

    async custom<TData extends BaseRecord = BaseRecord>({
      url,
      method,
      payload,
      query,
      filters,
      sorters,
      headers,
    }: NonNullable<Parameters<NonNullable<DataProvider["custom"]>>[0]>) {
      const searchParams = buildListSearchParams({ filters, sorters });

      // Merge any explicit query record on top of filter/sorter-derived params.
      if (query && typeof query === "object") {
        for (const [key, value] of Object.entries(query as Record<string, unknown>)) {
          searchParams.set(key, String(value));
        }
      }

      const data = await client.request<TData>(url, {
        method: method.toUpperCase() as HttpMethod,
        body: payload,
        searchParams,
        headers: headers as Record<string, string> | undefined,
      });

      return { data };
    },
  };
}
