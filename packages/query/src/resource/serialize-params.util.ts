/**
 * @file serialize-params.util.ts
 * @module @academorix/query/resource/serialize-params.util
 *
 * @description
 * Deterministic serialiser for {@link ResourceListParams} — turns the
 * caller's `{ page, per_page, sort, include, filter, ... }` object
 * into a `URLSearchParams` instance that the backend (Laravel via
 * spatie/laravel-query-builder) will parse.
 *
 * Nested `filter` objects flatten to bracket-syntax keys:
 *   `filter: { status: "active" }` → `filter[status]=active`
 *   `filter: { age: { gte: 12 } }` → `filter[age][gte]=12`
 *
 * Array values comma-join (Laravel's convention for `whereIn`):
 *   `filter: { branch: ["a", "b"] }` → `filter[branch]=a,b`
 */

import type { ResourceListParams } from "./resource.type";

/**
 * Recursively appends a value to `searchParams` under a bracket-syntax
 * key. Objects recurse; arrays comma-join; primitives stringify.
 */
function appendParam(searchParams: URLSearchParams, key: string, value: unknown): void {
  if (value === undefined || value === null) {
    return;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return;
    }

    searchParams.set(key, value.map(String).join(","));

    return;
  }

  if (typeof value === "object") {
    for (const [nestedKey, nestedValue] of Object.entries(value as Record<string, unknown>)) {
      appendParam(searchParams, `${key}[${nestedKey}]`, nestedValue);
    }

    return;
  }

  searchParams.set(key, String(value));
}

/**
 * Turns a {@link ResourceListParams} object into a
 * {@link URLSearchParams}. Empty values are omitted. Nested `filter`
 * objects flatten to bracket-syntax.
 */
export function serializeListParams(params: ResourceListParams | undefined): URLSearchParams {
  const searchParams = new URLSearchParams();

  if (!params) {
    return searchParams;
  }

  for (const [key, value] of Object.entries(params)) {
    appendParam(searchParams, key, value);
  }

  return searchParams;
}
