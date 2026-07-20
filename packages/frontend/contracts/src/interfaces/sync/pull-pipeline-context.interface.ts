/**
 * @file pull-pipeline-context.interface.ts
 * @module @stackra/contracts/interfaces/sync
 * @description Context threaded through the pull pipeline.
 */

import type { IPullOptions } from "./pull-options.interface";
import type { IPullResult } from "./pull-result.interface";
import type { ISyncCheckpoint } from "./sync-checkpoint.interface";

/**
 * Context threaded through every stage of the pull pipeline.
 */
export interface IPullPipelineContext {
  /** Collection being pulled. */
  collection: string;

  /** Pull options (base URL, cursor, limit, since). */
  options: IPullOptions;

  /** Result accumulated as the pipeline runs. */
  result: IPullResult;

  /** Checkpoint to persist after a successful pull. */
  checkpoint?: ISyncCheckpoint;
}
