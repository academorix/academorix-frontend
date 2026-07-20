/**
 * @file hash-predicate.interface.ts
 * @module @stackra/contracts/interfaces/routing
 * @description Predicate function type for the URL hash matcher.
 */

/**
 * A predicate that answers "does the current URL hash match?".
 *
 * @param hash - URL hash WITHOUT the leading `#` (e.g. `'/foo'`).
 * @returns `true` when the route should match; `false` otherwise.
 */
export interface IHashPredicate {
  (hash: string): boolean;
}
