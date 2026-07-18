/**
 * @file query-matchers.interface.ts
 * @module @stackra/contracts/interfaces/routing
 * @description Builder shape for the `query` matcher.
 */

import type { IQueryPredicate } from "./query-predicate.interface";

/**
 * Builder object exposing every predicate factory for the `query`
 * matcher. The concrete builder lives in `@stackra/routing/matchers`.
 */
export interface IQueryMatchers {
  /** Match when the query has `key` (any value). */
  has(key: string): IQueryPredicate;

  /** Negate a predicate (or a "has(key)" shortcut). */
  not(pred: IQueryPredicate | string): IQueryPredicate;

  /** Match when the query does NOT have `key`. */
  missing(key: string): IQueryPredicate;

  /** Match when `query.get(key) === value`. */
  equals(key: string, value: string): IQueryPredicate;

  /** Match when `query.get(key)` is in `values`. */
  oneOf(key: string, values: readonly string[]): IQueryPredicate;

  /** Match when `query.get(key)` matches the regex. */
  matching(key: string, regex: RegExp): IQueryPredicate;

  /** Compose predicates with logical AND. */
  and(...preds: IQueryPredicate[]): IQueryPredicate;

  /** Compose predicates with logical OR. */
  or(...preds: IQueryPredicate[]): IQueryPredicate;
}
