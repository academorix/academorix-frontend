/**
 * @file serialize-laravel-query.util.ts
 * @module @academorix/query/laravel/serialize-laravel-query.util
 *
 * @description
 * Translates a {@link LaravelQueryInput} (pagination + sorters + filters
 * + eager-loaded relations) into a `URLSearchParams` instance that a
 * {@link https://spatie.be/docs/laravel-query-builder/v7/introduction spatie/laravel-query-builder v7}
 * backend will parse.
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
 * ## Filtering model
 *
 * spatie is **named-filter** based: `filter[field]=value` maps to an
 * `AllowedFilter` whose semantics (exact vs partial vs comma-array)
 * are defined **server-side**. The client cannot force
 * exact-vs-partial — that is spatie's design. So we split the
 * operator set into two buckets:
 *
 *  - **Native** (`eq`, `eqs`, `contains`, `containss`, `in`, `ina`)
 *    → bare `filter[field]=value` (comma-joined for arrays). Handled
 *    by stock spatie `AllowedFilter::exact` / `::partial`.
 *  - **Custom operator** (everything else: `gte`, `lte`, `between`,
 *    `ne`, `null`, ...) → `filter[field][op]=value`. spatie parses
 *    this into an array value; a single custom operator filter on the
 *    backend interprets it.
 *
 * Presence operators (`null` / `nnull`) carry a sentinel `1` rather
 * than a comparison value.
 *
 * Empty values (`undefined` / `null` / `""`) drop the param entirely
 * — clearing a table filter should not emit an empty query segment.
 */

import type {
  LaravelConditionalFilter,
  LaravelFilter,
  LaravelFilterOperator,
  LaravelLogicalFilter,
  LaravelQueryInput,
  LaravelSorter,
} from "./laravel-query.type";

/**
 * Operators the server-side `AllowedFilter` interprets natively —
 * they emit `filter[field]=value` and the backend decides the
 * exact-vs-partial semantics. Everything else is encoded with an
 * explicit operator segment for a custom filter.
 */
const NATIVE_OPERATORS = new Set<LaravelFilterOperator>([
  "eq",
  "eqs",
  "contains",
  "containss",
  "in",
  "ina",
]);

/**
 * Coerces a filter value into its wire representation. Arrays become
 * comma-joined lists (matching Laravel `whereIn`); booleans become
 * `1` / `0` (matching MySQL boolean columns); everything else falls
 * back to `String(value)`.
 */
function serializeValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).join(",");
  }

  if (typeof value === "boolean") {
    return value ? "1" : "0";
  }

  return String(value);
}

/**
 * Structural guard that distinguishes a boolean-group filter from a
 * single field/operator/value predicate. Kept structural (rather than
 * `instanceof`-based) so this file stays framework-agnostic.
 */
function isConditionalFilter(filter: LaravelFilter): filter is LaravelConditionalFilter {
  return filter.operator === "or" || filter.operator === "and";
}

/**
 * Appends one logical predicate to the params using spatie's
 * convention:
 *
 *  - Native operator → `filter[field]=value` (bare).
 *  - Custom operator → `filter[field][operator]=value`.
 *  - Presence operator (`null` / `nnull`) → `filter[field][op]=1`.
 *  - Empty value (except presence operators) → param dropped.
 */
function appendLogicalFilter(params: URLSearchParams, filter: LaravelLogicalFilter): void {
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
 * Walks the filter tree and appends every leaf. Conditional (`and`
 * / `or`) groups are flattened by recursing into their children —
 * spatie's stock `AllowedFilter` API doesn't take server-side boolean
 * grouping, and in practice Refine tables emit only logical filters.
 * True server-side boolean grouping is a documented v2 concern.
 */
function appendFilters(params: URLSearchParams, filters: readonly LaravelFilter[]): void {
  for (const filter of filters) {
    if (isConditionalFilter(filter)) {
      appendFilters(params, filter.value);
    } else {
      appendLogicalFilter(params, filter);
    }
  }
}

/** Builds the spatie-style `sort` value, e.g. `-created_at,name`. */
function buildSortParam(sorters: readonly LaravelSorter[]): string {
  return sorters
    .map((sorter) => (sorter.order === "desc" ? `-${sorter.field}` : sorter.field))
    .join(",");
}

/**
 * Serialises a full list query into a `URLSearchParams` ready to hand
 * to any HTTP client. Empty inputs produce an empty `URLSearchParams`.
 *
 * @example
 * ```ts
 * const params = serializeLaravelQuery({
 *   pagination: { currentPage: 2, pageSize: 25 },
 *   sorters: [{ field: "created_at", order: "desc" }, { field: "name", order: "asc" }],
 *   filters: [
 *     { field: "status", operator: "eq", value: "active" },
 *     { field: "age", operator: "gte", value: 18 },
 *   ],
 *   include: ["branch", "team"],
 * });
 * params.toString();
 * // → "page=2&per_page=25&sort=-created_at%2Cname&include=branch%2Cteam
 * //     &filter%5Bstatus%5D=active&filter%5Bage%5D%5Bgte%5D=18"
 * ```
 */
export function serializeLaravelQuery(input: LaravelQueryInput = {}): URLSearchParams {
  const { pagination, sorters, filters, include } = input;
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
