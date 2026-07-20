/**
 * @file remote-wins.strategy.ts
 * @module @stackra/sync/core/strategies
 * @description Remote-wins conflict resolution — the remote copy always
 *   wins.
 */

import type { IConflict, IConflictResolverFn } from "@stackra/contracts";

/**
 * Remote-wins conflict resolution strategy.
 *
 * Always chooses the remote copy. Useful for collections where the
 * server is authoritative (e.g. server-generated IDs, computed fields).
 */
export const remoteWins: IConflictResolverFn = <T>(conflict: IConflict<T>): T => conflict.remote;
