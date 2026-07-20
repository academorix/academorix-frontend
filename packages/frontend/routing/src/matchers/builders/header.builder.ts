/**
 * @file header.builder.ts
 * @module @stackra/routing/matchers/builders
 * @description Predicate builder for the `header` matcher (PLAN v3.6).
 *
 *   Every method returns an `IHeaderPredicate`. Uses the WHATWG
 *   `Headers` API for parity with the browser's own request headers.
 *   Header names are case-insensitive by spec, so `equals` / `oneOf`
 *   compare with a lowercase value.
 */

import { Str } from "@stackra/support";
import type { IHeaderMatchers, IHeaderPredicate } from "@stackra/contracts";

/**
 * Callable header matcher builder.
 *
 * @example
 * ```typescript
 * import { header } from '@stackra/routing/matchers';
 *
 * const tenantAcme = header.equals('x-tenant', 'acme');
 * ```
 */
export const header: IHeaderMatchers = {
  has(name: string): IHeaderPredicate {
    return (h) => h.has(name);
  },

  not(pred: IHeaderPredicate | string): IHeaderPredicate {
    const inner = typeof pred === "string" ? header.has(pred) : pred;
    return (h) => !inner(h);
  },

  missing(name: string): IHeaderPredicate {
    return (h) => !h.has(name);
  },

  equals(name: string, value: string): IHeaderPredicate {
    // Header values are case-sensitive per RFC 7230 but real-world
    // callers frequently expect case-insensitive comparisons for
    // things like `Content-Type` variants. Lowercase both sides.
    const target = Str.lower(value);
    return (h) => {
      const raw = h.get(name);
      return raw !== null && Str.lower(raw) === target;
    };
  },

  oneOf(name: string, values: readonly string[]): IHeaderPredicate {
    // Precompute lowercased set for O(1) checks.
    const set = new Set(values.map((v) => Str.lower(v)));
    return (h) => {
      const raw = h.get(name);
      return raw !== null && set.has(Str.lower(raw));
    };
  },

  matching(name: string, regex: RegExp): IHeaderPredicate {
    return (h) => {
      const raw = h.get(name);
      return raw !== null && regex.test(raw);
    };
  },

  and(...preds: IHeaderPredicate[]): IHeaderPredicate {
    return (h) => preds.every((p) => p(h));
  },

  or(...preds: IHeaderPredicate[]): IHeaderPredicate {
    return (h) => preds.some((p) => p(h));
  },
};
