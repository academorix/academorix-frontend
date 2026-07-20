/**
 * @file last-write-wins.strategy.ts
 * @module @stackra/sync/core/strategies
 * @description Last-write-wins conflict resolution — the copy with the
 *   most recent timestamp wins.
 */

import type { IConflict, IConflictResolverFn } from "@stackra/contracts";

/**
 * Last-write-wins conflict resolution strategy.
 *
 * Resolves conflicts by choosing the document with the most recent
 * timestamp. Ties fall back to the local copy (so a clock skew never
 * silently overwrites local work).
 */
export const lastWriteWins: IConflictResolverFn = <T>(conflict: IConflict<T>): T => {
  if (conflict.remoteTimestamp > conflict.localTimestamp) {
    return conflict.remote;
  }
  return conflict.local;
};
