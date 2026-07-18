/**
 * @file subdomain.builder.ts
 * @module @stackra/routing/matchers/builders
 * @description Predicate builder for the `subdomain` matcher (PLAN v3.6).
 *
 *   Consumers can either use the callback form inline in `defineRoute`
 *   (`match: { subdomain: (s) => s.notIn(['www']) }`) or import the
 *   builder directly (`import { subdomain } from '@stackra/routing/matchers'`).
 *   Both forms compile to the same `ISubdomainPredicate` at runtime.
 */

import { Str } from "@stackra/support";
import type { ISubdomainMatchers, ISubdomainPredicate } from "@stackra/contracts";

/**
 * Callable subdomain matcher builder.
 *
 * @example
 * ```typescript
 * import { subdomain } from '@stackra/routing/matchers';
 *
 * const nonAdmin = subdomain.notIn(['www', 'admin']);
 * ```
 */
export const subdomain: ISubdomainMatchers = {
  // Exact match — lowercase comparison so the caller can pass either
  // `'Admin'` or `'admin'` without care.
  exact(name: string): ISubdomainPredicate {
    const target = Str.lower(name);
    return (input) => input !== null && Str.lower(input) === target;
  },

  not(pred: ISubdomainPredicate | string): ISubdomainPredicate {
    // Overload: `.not('admin')` is sugar for `.not(exact('admin'))`.
    // Anything else must already be a predicate function.
    const inner = typeof pred === "string" ? subdomain.exact(pred) : pred;
    return (input) => !inner(input);
  },

  oneOf(names: readonly string[]): ISubdomainPredicate {
    // Precompute the lowercased set for O(1) membership checks.
    const set = new Set(names.map((n) => Str.lower(n)));
    return (input) => input !== null && set.has(Str.lower(input));
  },

  notIn(names: readonly string[]): ISubdomainPredicate {
    const set = new Set(names.map((n) => Str.lower(n)));
    // Apex (`input === null`) is NOT in any list — so it matches.
    return (input) => input === null || !set.has(Str.lower(input));
  },

  startsWith(prefix: string): ISubdomainPredicate {
    const p = Str.lower(prefix);
    return (input) => input !== null && Str.lower(input).startsWith(p);
  },

  endsWith(suffix: string): ISubdomainPredicate {
    const s = Str.lower(suffix);
    return (input) => input !== null && Str.lower(input).endsWith(s);
  },

  contains(fragment: string): ISubdomainPredicate {
    const f = Str.lower(fragment);
    return (input) => input !== null && Str.lower(input).includes(f);
  },

  matching(regex: RegExp): ISubdomainPredicate {
    return (input) => input !== null && regex.test(input);
  },

  any(): ISubdomainPredicate {
    // Any non-empty subdomain — i.e. NOT apex.
    return (input) => input !== null && input.length > 0;
  },

  none(): ISubdomainPredicate {
    // Apex-only.
    return (input) => input === null;
  },

  and(...preds: ISubdomainPredicate[]): ISubdomainPredicate {
    // Short-circuit AND — bail on the first miss.
    return (input) => preds.every((p) => p(input));
  },

  or(...preds: ISubdomainPredicate[]): ISubdomainPredicate {
    // Short-circuit OR — accept on the first hit.
    return (input) => preds.some((p) => p(input));
  },
};
