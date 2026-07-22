/**
 * @file use-conflict-resolver.hook.ts
 * @module @stackra/sync/react/hooks
 * @description React hook that batches a caller-managed list of unresolved
 *   conflicts and forwards resolve decisions through the DI-managed
 *   {@link ConflictResolver}.
 */

import { useCallback, useState } from "react";
import { useInject } from "@stackra/container/react";
import type { IConflict, IConflictResolution } from "@stackra/contracts";
import { CONFLICT_RESOLVER } from "@stackra/contracts";
import type { ConflictResolver } from "@/core/resolvers/conflict.resolver";

/**
 * Result returned by {@link useConflictResolver}.
 */
export interface IUseConflictResolverResult {
  /** Conflicts currently awaiting a resolution decision. */
  conflicts: IConflict[];
  /** Whether at least one conflict is awaiting resolution. */
  hasConflicts: boolean;
  /** Add a conflict to the local waiting list. */
  addConflict: (conflict: IConflict) => void;
  /** Resolve a single conflict through the DI-managed resolver. */
  resolve: (conflict: IConflict) => Promise<IConflictResolution>;
  /** Drop every waiting conflict (does not run any resolver). */
  reset: () => void;
}

/**
 * React hook for surfacing and resolving sync conflicts.
 *
 * The hook holds a locally-managed list of {@link IConflict}s that the
 * caller populates (e.g. from a sync progress subscription) and hands each
 * accepted conflict to the injected {@link ConflictResolver}.
 */
export function useConflictResolver(): IUseConflictResolverResult {
  const resolver = useInject<ConflictResolver>(CONFLICT_RESOLVER);
  const [conflicts, setConflicts] = useState<IConflict[]>([]);

  const addConflict = useCallback((conflict: IConflict) => {
    setConflicts((prev) => [...prev, conflict]);
  }, []);

  const resolve = useCallback(
    async (conflict: IConflict): Promise<IConflictResolution> => {
      const resolution = await resolver.resolve(conflict);
      setConflicts((prev) => prev.filter((c) => c.id !== conflict.id));
      return resolution;
    },
    [resolver],
  );

  const reset = useCallback(() => setConflicts([]), []);

  return {
    conflicts,
    hasConflicts: conflicts.length > 0,
    addConflict,
    resolve,
    reset,
  };
}
