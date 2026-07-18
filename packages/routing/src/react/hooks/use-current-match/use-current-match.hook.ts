/**
 * @file use-current-match.hook.ts
 * @module @stackra/routing/react/hooks/use-current-match
 * @description Return the deepest (leaf) match in the current chain.
 *
 *   Bridges RRv7's `useMatches()` output — the framework's hooks and
 *   components read the leaf match to pull the current route's SEO
 *   descriptor, analytics event, breadcrumb text, etc.
 */

import { useMatches } from "react-router";

/**
 * Shape returned by RRv7's `useMatches()`. Framework-scoped so
 * consumers don't type against `react-router` directly.
 */
export interface ICurrentMatch<TData = unknown> {
  /** Route id — matches the id assigned by the framework's adapter. */
  readonly id: string;

  /** Matched pathname. */
  readonly pathname: string;

  /** Path params for this segment. */
  readonly params: Readonly<Record<string, string>>;

  /** Loader data for this match. */
  readonly data: TData;

  /** Framework metadata bag. */
  readonly handle: Readonly<Record<string | symbol, unknown>>;
}

/**
 * Return the deepest match currently active. `null` when no match
 * exists (unusual — only during error boundaries at the root).
 *
 * @returns Current leaf match, or `null`.
 *
 * @example
 * ```typescript
 * const match = useCurrentMatch();
 * if (match) console.log('At', match.pathname);
 * ```
 */
export function useCurrentMatch<TData = unknown>(): ICurrentMatch<TData> | null {
  const matches = useMatches();
  if (matches.length === 0) return null;
  const leaf = matches[matches.length - 1];
  // RRv7's Match shape matches our own — return as-is via a safe cast.
  return leaf as unknown as ICurrentMatch<TData>;
}
