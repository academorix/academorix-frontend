/**
 * @file local-wins.strategy.ts
 * @module @stackra/sync/core/strategies
 * @description Local-wins conflict resolution — the local copy always
 *   wins.
 */

import type { IConflict, IConflictResolverFn } from '@stackra/contracts';

/**
 * Local-wins conflict resolution strategy.
 *
 * Always chooses the local copy. Useful for collections where the
 * client is authoritative (e.g. draft edits the user has not published).
 */
export const localWins: IConflictResolverFn = <T>(conflict: IConflict<T>): T => conflict.local;
