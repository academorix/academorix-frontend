/**
 * @file laravel-query.ts
 * @module lib/query/laravel-query
 *
 * @description
 * Translates Refine's `pagination` / `sorters` / `filters` into the query
 * string the Laravel REST API understands, following
 * {@link https://spatie.be/docs/laravel-query-builder/v7/introduction spatie/laravel-query-builder v7}.
 *
 * ## The contract
 *
 * | Concept    | Query param(s)                                            |
 * | ---------- | --------------------------------------------------------- |
 * | Pagination | `page=<n>&per_page=<size>` (Laravel paginator)            |
 * | Sorting    | `sort=-created_at,name` (spatie; `-` = descending)        |
 * | Includes   | `include=branch,team` (spatie `AllowedInclude`)          |
 * | Filtering  | `filter[status]=active` (spatie `AllowedFilter`)         |
 * | Operators  | `filter[age][gte]=18` (spatie **custom** operator filter) |
 *
 * ## Filtering model (important)
 * spatie is **named-filter** based: `filter[field]=value` maps to an
 * `AllowedFilter` whose semantics (exact vs partial vs comma-array) are defined
 * **server-side**. The client cannot force exact-vs-partial — that's spatie's
 * design. So we split Refine's operators into two buckets:
 *
 * - **Native** (`eq`, `eqs`, `contains`, `containss`, `in`, `ina`) → bare
 *   `filter[field]=value` (comma-joined for arrays). Handled by stock spatie
 *   `AllowedFilter::exact` / `::partial`.
 * - **Operator** (everything else: `gte`, `lte`, `between`, `ne`, `null`, …) →
 *   `filter[field][<operator>]=value`. spatie parses this into an array value;
 *   a single custom operator filter on the backend interprets it.
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
 * Operators that map to a stock spatie `AllowedFilter` via the bare
 * `filter[field]=value` form (the backend decides exact vs partial). Everything
 * else is encoded with an explicit operator segment for a custom filter.
 */
const NATIVE_OPERATORS = new Set<LogicalFilter["operator"]>([
  "eq",
  "eqs",
  "contains",
  "containss",
  "in",
  "ina",
]);

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
 * Appends a single logical filter using spatie's convention: a bare
 * `filter[field]=value` for native operators, or `filter[field][op]=value` for
 * comparison/range/presence operators (interpreted by a custom spatie filter).
 */
function appendLogicalFilter(params: URLSearchParams, filter: LogicalFilter): void {
  const { field, operator, value } = filter;
  const isPresenceOperator = operator === "null" || operator === "nnull";

  // Skip empty values so clearing a table filter drops the param entirely —
  // except presence operators, which assert on absence, not a value.
  if (!isPresenceOperator && (value === undefined || value === null || value === "")) {
    return;
  }

  if (NATIVE_OPERATORS.has(operator)) {
    params.append(`filter[${field}]`, serializeValue(value));

    return;
  }

  // Presence operators carry a sentinel `1` rather than a comparison value.
  const serialized = isPresenceOperator ? "1" : serializeValue(value);

  params.append(`filter[${field}][${operator}]`, serialized);
}

/**
 * Recursively flattens filters into the params. Conditional (`and`/`or`) groups
 * are flattened by emitting their children; true server-side boolean grouping
 * is a documented v2 concern (tables emit logical filters in practice).
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
  /** spatie `AllowedInclude` relations to eager-load, e.g. `["branch", "team"]`. */
  include?: string[];
}

/**
 * Builds the complete `URLSearchParams` for a `getList` request from Refine's
 * table state, following the spatie query-builder contract.
 *
 * @param input - Refine's `pagination`, `sorters`, `filters`, and `include`.
 * @returns Query params ready to hand to {@link HttpClient.get}.
 */
export function buildListSearchParams({
  pagination,
  sorters,
  filters,
  include,
}: ListQueryInput): URLSearchParams {
  const params = new URLSearchParams();

  // Pagination — omitted entirely when the caller disables it (`mode: "off"`).
  if (pagination && pagination.mode !== "off") {
    params.set("page", String(pagination.currentPage ?? 1));
    params.set("per_page", String(pagination.pageSize ?? 10));
  }

  if (sorters && sorters.length > 0) {
    params.set("sort", buildSortParam(sorters));
  }

  if (include && include.length > 0) {
    params.set("include", include.join(","));
  }

  if (filters && filters.length > 0) {
    appendFilters(params, filters);
  }

  return params;
}
