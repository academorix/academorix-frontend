/**
 * @file subdomain-predicate.interface.ts
 * @module @stackra/contracts/interfaces/routing
 * @description Predicate function type for the subdomain matcher.
 */

/**
 * A predicate that answers "does the current subdomain match?".
 *
 * @param subdomain - Parsed subdomain (e.g. `'admin'`) or `null` when
 *   the request hits the apex domain.
 * @returns `true` when the route should match; `false` otherwise.
 */
export interface ISubdomainPredicate {
  (subdomain: string | null): boolean;
}
