/**
 * @file hash-matchers.interface.ts
 * @module @stackra/contracts/interfaces/routing
 * @description Builder shape for the URL `hash` matcher.
 */

import type { IHashPredicate } from "./hash-predicate.interface";

/**
 * Builder object exposing every predicate factory for the URL hash
 * matcher. The concrete builder lives in `@stackra/routing/matchers`.
 */
export interface IHashMatchers {
  /** Match when the hash equals `hash` (with or without the leading `#`). */
  exact(hash: string): IHashPredicate;

  /** Negate a predicate (or an exact hash string). */
  not(pred: IHashPredicate | string): IHashPredicate;

  /** Match when the hash starts with `prefix`. */
  startsWith(prefix: string): IHashPredicate;

  /** Match when the hash ends with `suffix`. */
  endsWith(suffix: string): IHashPredicate;

  /** Match when the hash contains `fragment`. */
  contains(fragment: string): IHashPredicate;

  /** Match when the hash matches the regex. */
  matching(regex: RegExp): IHashPredicate;

  /** Match only when the hash is empty. */
  empty(): IHashPredicate;

  /** Match when the hash has any value. */
  present(): IHashPredicate;

  /** Compose predicates with logical AND. */
  and(...preds: IHashPredicate[]): IHashPredicate;

  /** Compose predicates with logical OR. */
  or(...preds: IHashPredicate[]): IHashPredicate;
}
