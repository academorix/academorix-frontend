/**
 * @file header-predicate.interface.ts
 * @module @stackra/contracts/interfaces/routing
 * @description Predicate function type for the header matcher.
 */

/**
 * A predicate that answers "does the current request header match?".
 *
 * @param headers - Request headers as a WHATWG `Headers` object.
 * @returns `true` when the route should match; `false` otherwise.
 */
export interface IHeaderPredicate {
  (headers: Headers): boolean;
}
