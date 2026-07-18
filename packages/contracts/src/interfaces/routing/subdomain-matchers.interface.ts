/**
 * @file subdomain-matchers.interface.ts
 * @module @stackra/contracts/interfaces/routing
 * @description Builder shape for the `subdomain` matcher.
 */

import type { ISubdomainPredicate } from "./subdomain-predicate.interface";

/**
 * Builder object exposing every predicate factory for the `subdomain`
 * matcher. The concrete builder lives in `@stackra/routing/matchers`.
 */
export interface ISubdomainMatchers {
  /** Exact subdomain match — case-insensitive. */
  exact(name: string): ISubdomainPredicate;

  /** Negate a predicate (or an exact subdomain string). */
  not(pred: ISubdomainPredicate | string): ISubdomainPredicate;

  /** Match if the subdomain equals any of `names`. */
  oneOf(names: readonly string[]): ISubdomainPredicate;

  /** Match if the subdomain is NOT in `names`. */
  notIn(names: readonly string[]): ISubdomainPredicate;

  /** Match if the subdomain starts with `prefix`. */
  startsWith(prefix: string): ISubdomainPredicate;

  /** Match if the subdomain ends with `suffix`. */
  endsWith(suffix: string): ISubdomainPredicate;

  /** Match if the subdomain contains `fragment`. */
  contains(fragment: string): ISubdomainPredicate;

  /** Match if the subdomain matches the regex. */
  matching(regex: RegExp): ISubdomainPredicate;

  /** Match any non-empty subdomain (i.e. NOT apex). */
  any(): ISubdomainPredicate;

  /** Match only the apex domain (no subdomain). */
  none(): ISubdomainPredicate;

  /** Compose predicates with logical AND. */
  and(...preds: ISubdomainPredicate[]): ISubdomainPredicate;

  /** Compose predicates with logical OR. */
  or(...preds: ISubdomainPredicate[]): ISubdomainPredicate;
}
