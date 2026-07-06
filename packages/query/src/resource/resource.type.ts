/**
 * @file resource.type.ts
 * @module @academorix/query/resource/resource.type
 *
 * @description
 * Shape of a resource declaration + the params/results the generated
 * hooks accept. Kept as a separate file so downstream types can
 * import them without pulling the runtime `defineResource` factory.
 */

/** A REST resource this package can generate hooks for. */
export interface ResourceDefinition<TRecord, TId extends string | number = string> {
  /**
   * Path relative to the HTTP client's `baseUrl`, e.g. `"athletes"`
   * or `"v1/tenants"`. The client prepends its own base URL.
   */
  readonly path: string;

  /**
   * Name of the primary-key field on `TRecord`. Defaults to `"id"`.
   * Only affects hooks that need to read the id from the payload
   * (e.g. cache updates after `useCreate`); not part of the key
   * signature itself.
   */
  readonly primaryKey?: keyof TRecord & string;

  /**
   * Compile-time-only hint about the id type. Runtime hooks accept
   * `string | number` and coerce to string for cache keys.
   */
  readonly _idType?: TId;
}

/**
 * Free-form list params passed to `useList`. Filters, sorters, and
 * pagination — the shape depends on the backend's query-builder
 * conventions.
 *
 * We deliberately don't lock the shape here; different backends may
 * use different filter operators. Apps can pass whatever their
 * `httpClient` accepts as query strings.
 */
export interface ResourceListParams {
  readonly page?: number;
  readonly per_page?: number;
  readonly sort?: string;
  readonly include?: string;
  readonly filter?: Record<string, unknown>;
  readonly [key: string]: unknown;
}

/** Response shape for `useList` — matches Foundation envelope's list case. */
export interface ResourceListResult<TRecord> {
  readonly data: readonly TRecord[];
  readonly total?: number;
}
