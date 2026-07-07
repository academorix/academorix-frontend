/**
 * @file laravel-query.type.ts
 * @module @academorix/query/laravel/laravel-query.type
 *
 * @description
 * Structural types describing the input {@link serializeLaravelQuery}
 * accepts. Kept independent of `@refinedev/core` so this package does
 * not have to pin a specific Refine major version — the shapes are a
 * strict superset of what Refine v5 emits for
 * `getList`/`getMany`/`custom`, and are intentionally compatible with
 * that surface at the structural level.
 *
 * The wire format itself is
 * {@link https://spatie.be/docs/laravel-query-builder/v7/introduction spatie/laravel-query-builder v7},
 * split into two operator categories:
 *
 *  - **Native operators** (`eq`, `eqs`, `contains`, `containss`, `in`,
 *    `ina`) → bare `filter[field]=value` — the server-side
 *    `AllowedFilter` decides exact vs partial semantics.
 *  - **Custom operators** (everything else) → `filter[field][op]=value`
 *    — parsed by a custom spatie filter class into a structured
 *    comparison.
 */

/** Sort direction for a single field. Mirrors Refine v5's `SortOrder`. */
export type LaravelSortOrder = "asc" | "desc";

/** Single-column sort clause. */
export interface LaravelSorter {
  /** Column name, e.g. `"created_at"` or `"team.name"` (dotted for relations). */
  readonly field: string;
  /** Sort direction. Emitted as a `-` prefix when `"desc"`. */
  readonly order: LaravelSortOrder;
}

/**
 * The full operator set spatie's stock + custom filters can express.
 * Matches Refine v5's `CrudOperators` minus the two group operators
 * (`or`, `and`, which live on {@link LaravelConditionalFilter}).
 */
export type LaravelFilterOperator =
  | "eq"
  | "eqs"
  | "contains"
  | "containss"
  | "in"
  | "ina"
  | "ne"
  | "nes"
  | "ncontains"
  | "ncontainss"
  | "nin"
  | "nina"
  | "lt"
  | "lte"
  | "gt"
  | "gte"
  | "between"
  | "nbetween"
  | "null"
  | "nnull"
  | "startswith"
  | "startswiths"
  | "endswith"
  | "endswiths";

/**
 * A single field/operator/value predicate. Mirrors Refine v5's
 * `LogicalFilter`.
 */
export interface LaravelLogicalFilter {
  /** Column name the predicate applies to. */
  readonly field: string;
  /** Operator — one of {@link LaravelFilterOperator}. */
  readonly operator: LaravelFilterOperator;
  /**
   * The value the operator compares against. Arrays are comma-joined
   * on the wire; booleans become `1`/`0`. Ignored (drop param) when
   * `undefined` / `null` / `""` — except for presence operators
   * (`null` / `nnull`), which are pure absence assertions.
   */
  readonly value: unknown;
}

/**
 * Boolean grouping of nested filters. Mirrors Refine v5's
 * `ConditionalFilter`.
 *
 * The current serialiser flattens the children — spatie's stock
 * `AllowedFilter` API doesn't take server-side `AND` / `OR` grouping
 * directly. Reserved on the wire format for a future custom filter.
 */
export interface LaravelConditionalFilter {
  /** Logical connective for the nested children. */
  readonly operator: "and" | "or";
  /**
   * Nested filters — may itself contain further conditional groups,
   * yielding an arbitrarily deep boolean tree. The serialiser walks
   * the tree recursively.
   */
  readonly value: readonly LaravelFilter[];
}

/**
 * Union of the two filter shapes. Corresponds structurally to Refine
 * v5's `CrudFilter`.
 */
export type LaravelFilter = LaravelLogicalFilter | LaravelConditionalFilter;

/**
 * Pagination controls. Mirrors Refine v5's `Pagination`; the
 * `mode: "off"` case tells the serialiser to skip both `page` and
 * `per_page` entirely.
 */
export interface LaravelListPagination {
  /**
   * When `"off"`, pagination params are omitted entirely (backend
   * returns the full collection). Any other value (or `undefined`)
   * emits `page` + `per_page`.
   */
  readonly mode?: "off" | "server" | "client";
  /** 1-indexed page number. Defaults to `1` when pagination is enabled. */
  readonly currentPage?: number;
  /** Items per page. Defaults to `10` when pagination is enabled. */
  readonly pageSize?: number;
}

/**
 * The full input {@link serializeLaravelQuery} accepts. Every field is
 * optional — an empty object produces empty search params.
 */
export interface LaravelQueryInput {
  /** Pagination clause. */
  readonly pagination?: LaravelListPagination;
  /** Ordered list of sort clauses. Emitted as `sort=-a,b`. */
  readonly sorters?: readonly LaravelSorter[];
  /** Filter tree. Conditional groups are flattened during serialisation. */
  readonly filters?: readonly LaravelFilter[];
  /**
   * spatie `AllowedInclude` relations to eager-load, e.g.
   * `["branch", "team"]`. Comma-joined into a single `include=` param.
   */
  readonly include?: readonly string[];
}
