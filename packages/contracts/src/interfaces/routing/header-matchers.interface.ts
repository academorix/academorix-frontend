/**
 * @file header-matchers.interface.ts
 * @module @stackra/contracts/interfaces/routing
 * @description Builder shape for the `header` matcher.
 */

import type { IHeaderPredicate } from "./header-predicate.interface";

/**
 * Builder object exposing every predicate factory for the `header`
 * matcher. The concrete builder lives in `@stackra/routing/matchers`.
 */
export interface IHeaderMatchers {
  /** Match when the header is present (any value). */
  has(name: string): IHeaderPredicate;

  /** Negate a predicate (or a "has(name)" shortcut). */
  not(pred: IHeaderPredicate | string): IHeaderPredicate;

  /** Match when the header is absent. */
  missing(name: string): IHeaderPredicate;

  /** Match when the header equals `value` (case-insensitive). */
  equals(name: string, value: string): IHeaderPredicate;

  /** Match when the header value is in `values` (case-insensitive). */
  oneOf(name: string, values: readonly string[]): IHeaderPredicate;

  /** Match when the header value matches the regex. */
  matching(name: string, regex: RegExp): IHeaderPredicate;

  /** Compose predicates with logical AND. */
  and(...preds: IHeaderPredicate[]): IHeaderPredicate;

  /** Compose predicates with logical OR. */
  or(...preds: IHeaderPredicate[]): IHeaderPredicate;
}
