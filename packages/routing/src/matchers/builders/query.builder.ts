/**
 * @file query.builder.ts
 * @module @stackra/routing/matchers/builders
 * @description Predicate builder for the `query` matcher (PLAN v3.6).
 *
 *   Every method returns an `IQueryPredicate` — a function `(query:
 *   URLSearchParams) => boolean`. Uses the WHATWG URLSearchParams API
 *   for parity with the browser's own parsing.
 */

import type { IQueryMatchers, IQueryPredicate } from "@stackra/contracts";

/**
 * Callable query-string matcher builder.
 *
 * @example
 * ```typescript
 * import { query } from '@stackra/routing/matchers';
 *
 * const previewMode = query.has('preview');
 * ```
 */
export const query: IQueryMatchers = {
  has(key: string): IQueryPredicate {
    return (q) => q.has(key);
  },

  not(pred: IQueryPredicate | string): IQueryPredicate {
    // Overload: string form is sugar for `.has(pred)`.
    const inner = typeof pred === "string" ? query.has(pred) : pred;
    return (q) => !inner(q);
  },

  missing(key: string): IQueryPredicate {
    return (q) => !q.has(key);
  },

  equals(key: string, value: string): IQueryPredicate {
    return (q) => q.get(key) === value;
  },

  oneOf(key: string, values: readonly string[]): IQueryPredicate {
    // Precompute the set for O(1) membership checks.
    const set = new Set(values);
    return (q) => {
      const raw = q.get(key);
      return raw !== null && set.has(raw);
    };
  },

  matching(key: string, regex: RegExp): IQueryPredicate {
    return (q) => {
      const raw = q.get(key);
      return raw !== null && regex.test(raw);
    };
  },

  and(...preds: IQueryPredicate[]): IQueryPredicate {
    return (q) => preds.every((p) => p(q));
  },

  or(...preds: IQueryPredicate[]): IQueryPredicate {
    return (q) => preds.some((p) => p(q));
  },
};
