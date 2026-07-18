/**
 * @file query-predicate.interface.ts
 * @module @stackra/contracts/interfaces/routing
 * @description Predicate function type for the query-string matcher.
 */

/**
 * A predicate that answers "does the current query string match?".
 *
 * @param query - Parsed `URLSearchParams` for the request.
 * @returns `true` when the route should match; `false` otherwise.
 */
export interface IQueryPredicate {
  (query: URLSearchParams): boolean;
}
