/**
 * @file full-sync-pipeline-context.interface.ts
 * @module @stackra/contracts/interfaces/sync
 * @description Context threaded through the full-sync (push-then-pull)
 *   pipeline.
 */

import type { IPullOptions } from "./pull-options.interface";
import type { IPushOptions } from "./push-options.interface";
import type { ISyncResult } from "./sync-result.interface";

/**
 * Context threaded through the full-sync pipeline.
 */
export interface IFullSyncPipelineContext {
  /** Collections to sync in this run. */
  collections: string[];

  /** Factory that produces pull options for a given collection. */
  pullOptionsFactory: (collection: string) => IPullOptions;

  /** Factory that produces push options for a given collection. */
  pushOptionsFactory: (collection: string) => IPushOptions;

  /** Accumulated result of the run. */
  result: ISyncResult;

  /** Timestamp when the run started (millisecond epoch). */
  startTime: number;
}
