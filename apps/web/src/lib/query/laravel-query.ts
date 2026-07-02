/**
 * @file laravel-query.ts
 * @module lib/query/laravel-query
 *
 * @description
 * Translates Refine's `pagination` / `sorters` / `filters` into the query
 * string the Laravel REST API understands. This is the single place the
 * frontend↔backend list contract is defined, so both the REST data provider
 * and (for parity) the mock provider's expectations stay in lockstep.
 *
 * ## The contract
 *
 * | Concept    | Query param(s)                                            |
 * | ---------- | --------------------------------------------------------- |
 * | Pagination | `page=<n>&per_page=<size>`                                 |
 * | Sorting    | `sort=-created_at,name` (spatie-style, `-` = descending)  |
 * | Equality   | `filter[status]=active`                                   |
 * | Operators  | `filter[age][gte]=18`, `filter[level][in]=a,b`            |
 *
 * This mirrors `spatie/laravel-query-builder` (the de-facto Laravel standard)
 * for pagination and sorting, and extends its `filter[...]` convention with an
 * explicit operator segment so every Refine `CrudOperator` round-trips
 * losslessly. The backend implements matching custom filters.
 */

import type {
  ConditionalFilter,
  CrudFilter,
  CrudFilters,
  CrudSorting,
  LogicalFilter,
  Pagination,
} from "@refinedev/core";

/**
 * Maps Refine's rich operator set to the token used in the
 * `filter[field][<token>]` segment. `eq` is special-cased by the caller to a
 * bare `filter[field]=value`, so it is absent here.
 *
 * Unmapped operators fall back to their raw Refine string, which keeps the
 * contract forward-compatible if Refine adds new operators.
 */
const OPERATOR_TOKENS: Partial<Record<LogicalFilter["operator"], string>> = {
  ne: "ne",
  lt: "lt",
  gt: "gt",
  lte: "lte",
  gte: "gte",
  in: "in",
  nin: "nin",
  contains: "like",
  ncontains: "not_like",
  containss: "like",
  ncontainss: "not_like",
  startswith: "starts_with",
  nstartswith: "not_starts_with",
  endswith: "ends_with",
  nendswith: "not_ends_with",
  null: "null",
  nnull: "not_null",
  between: "between",
  nbetween: "not_between",
};

/** Serialises a filter value: arrays become comma lists, booleans become 1/0. */
function serializeValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).join(",");
  }

  if (typeof value === "boolean") {
    return value ? "1" : "0";
  }

  return String(value);
}

/** Type guard distinguishing a conditional (`and`/`or`) filter from a logical one. */
function isConditionalFilter(filter: CrudFilter): filter is ConditionalFilter {
  return filter.operator === "or" || filter.operator === "and";
}

/**
 * Appends a single logical filter to the params as either a bare equality
 * (`filter[field]=value`) or an operator-scoped entry
 * (`filter[field][gte]=value`).
 */
function appendLogicalFilter(params: URLSearchParams, filter: LogicalFilter): void {
  const { field, operator, value } = filter;

  // Skip empty values so clearing a table filter drops the param entirely.
  if (value === undefined || value === null || value === "") {
    // `null`/`nnull` are the exception — they assert presence, not a value.
    if (operator !== "null" && operator !== "nnull") {
      return;
    }
  }

  if (operator === "eq") {
    params.append(`filter[${field}]`, serializeValue(value));

    return;
  }

  const token = OPERATOR_TOKENS[operator] ?? operator;

  // Presence operators carry a sentinel `1` rather than a comparison value.
  const serialized = operator === "null" || operator === "nnull" ? "1" : serializeValue(value);

  params.append(`filter[${field}][${token}]`, serialized);
}

/**
 * Recursively flattens filters into the params. Conditional (`and`/`or`)
 * groups are flattened by emitting their children; true server-side boolean
 * grouping is a documented v2 concern (tables emit logical filters in practice).
 */
function appendFilters(params: URLSearchParams, filters: CrudFilters): void {
  for (const filter of filters) {
    if (isConditionalFilter(filter)) {
      appendFilters(params, filter.value);
    } else {
      appendLogicalFilter(params, filter);
    }
  }
}

/** Builds the spatie-style `sort` value, e.g. `-created_at,name`. */
function buildSortParam(sorters: CrudSorting): string {
  return sorters
    .map((sorter) => (sorter.order === "desc" ? `-${sorter.field}` : sorter.field))
    .join(",");
}

/** Inputs accepted by {@link buildListSearchParams}. */
export interface ListQueryInput {
  pagination?: Pagination;
  sorters?: CrudSorting;
  filters?: CrudFilters;
}

/**
 * Builds the complete `URLSearchParams` for a `getList` request from Refine's
 * table state.
 *
 * @param input - Refine's `pagination`, `sorters`, and `filters`.
 * @returns Query params ready to hand to {@link HttpClient.get}.
 */
export function buildListSearchParams({
  pagination,
  sorters,
  filters,
}: ListQueryInput): URLSearchParams {
  const params = new URLSearchParams();

  // Pagination — omitted entirely when the caller disables it (`mode: "off"`).
  if (pagination && pagination.mode !== "off") {
    const currentPage = pagination.currentPage ?? 1;
    const pageSize = pagination.pageSize ?? 10;

    params.set("page", String(currentPage));
    params.set("per_page", String(pageSize));
  }

  if (sorters && sorters.length > 0) {
    params.set("sort", buildSortParam(sorters));
  }

  if (filters && filters.length > 0) {
    appendFilters(params, filters);
  }

  return params;
}
