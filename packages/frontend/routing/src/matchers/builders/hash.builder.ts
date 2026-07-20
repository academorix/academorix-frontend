/**
 * @file hash.builder.ts
 * @module @stackra/routing/matchers/builders
 * @description Predicate builder for the URL `hash` matcher (PLAN v3.6).
 *
 *   The predicate receives the hash WITHOUT the leading `#`, matching
 *   the shape `IHashPredicate` expects. `.exact('#/foo')` and
 *   `.exact('/foo')` are treated equivalently to keep the caller-side
 *   ergonomic.
 */

import { Str } from "@stackra/support";
import type { IHashMatchers, IHashPredicate } from "@stackra/contracts";

/**
 * Strip the leading `#` if present. The runtime hash arrives without
 * it, but call sites often include it — normalise so the two forms
 * behave identically.
 */
function stripHash(hash: string): string {
  return hash.startsWith("#") ? hash.slice(1) : hash;
}

/**
 * Callable URL-hash matcher builder.
 *
 * @example
 * ```typescript
 * import { hash } from '@stackra/routing/matchers';
 *
 * const modalOpen = hash.startsWith('/dialog/');
 * ```
 */
export const hash: IHashMatchers = {
  exact(hashValue: string): IHashPredicate {
    // Accept either `#/foo` or `/foo` — both compare to the same
    // stripped form.
    const target = stripHash(hashValue);
    return (input) => input === target;
  },

  not(pred: IHashPredicate | string): IHashPredicate {
    const inner = typeof pred === "string" ? hash.exact(pred) : pred;
    return (input) => !inner(input);
  },

  startsWith(prefix: string): IHashPredicate {
    const p = stripHash(prefix);
    return (input) => Str.startsWith(input, p);
  },

  endsWith(suffix: string): IHashPredicate {
    const s = stripHash(suffix);
    return (input) => Str.endsWith(input, s);
  },

  contains(fragment: string): IHashPredicate {
    const f = stripHash(fragment);
    return (input) => Str.contains(input, f);
  },

  matching(regex: RegExp): IHashPredicate {
    return (input) => regex.test(input);
  },

  empty(): IHashPredicate {
    return (input) => input.length === 0;
  },

  present(): IHashPredicate {
    return (input) => input.length > 0;
  },

  and(...preds: IHashPredicate[]): IHashPredicate {
    return (input) => preds.every((p) => p(input));
  },

  or(...preds: IHashPredicate[]): IHashPredicate {
    return (input) => preds.some((p) => p(input));
  },
};
