/**
 * @file use-history-stack.hook.ts
 * @module @stackra/routing/react/hooks/use-history-stack
 * @description Return a read-only view of the recent history stack.
 *
 *   Browsers don't expose the raw history stack for security
 *   reasons, so F.2 tracks entries the framework observes via
 *   RRv7's location subscription. The hook returns the framework's
 *   in-memory ring — up to the most recent 32 entries — which is
 *   sufficient for the current caller set (breadcrumbs, dev-tools).
 *
 *   The list order is oldest-first. The most recent entry equals
 *   the current location.
 *
 * TODO(F.3): consider promoting the ring into a store so devtools
 *   can subscribe.
 */

import { useEffect, useState } from "react";
import { useLocation } from "react-router";

/**
 * A single history entry the framework has observed.
 */
export interface IHistoryEntry {
  /** Full pathname. */
  readonly pathname: string;

  /** Optional search. */
  readonly search: string;

  /** Optional hash. */
  readonly hash: string;

  /** ISO timestamp of the visit. */
  readonly visitedAt: string;
}

// Module-scoped ring buffer — 32 entries is enough for breadcrumbs
// and dev-tools without inflating memory.
const HISTORY_RING_CAPACITY = 32;
const historyRing: IHistoryEntry[] = [];

/**
 * Return the framework's observed history stack (oldest first).
 *
 * @returns Read-only history stack.
 *
 * @example
 * ```typescript
 * const stack = useHistoryStack();
 * console.log('Recent pages:', stack.map((e) => e.pathname));
 * ```
 */
export function useHistoryStack(): readonly IHistoryEntry[] {
  const location = useLocation();
  const [snapshot, setSnapshot] = useState<readonly IHistoryEntry[]>([]);

  useEffect(() => {
    // Append the current location; trim to capacity from the front.
    const entry: IHistoryEntry = {
      pathname: location.pathname,
      search: location.search,
      hash: location.hash,
      visitedAt: new Date().toISOString(),
    };
    historyRing.push(entry);
    if (historyRing.length > HISTORY_RING_CAPACITY) {
      // Trim from the head — oldest entries drop off first.
      historyRing.splice(0, historyRing.length - HISTORY_RING_CAPACITY);
    }
    // Snapshot the ring for this hook consumer. Slice defensively so
    // downstream mutations don't leak into subsequent renders.
    setSnapshot([...historyRing]);
  }, [location.pathname, location.search, location.hash]);

  return snapshot;
}
