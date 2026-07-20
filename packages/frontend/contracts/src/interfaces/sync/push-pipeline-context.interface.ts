/**
 * @file push-pipeline-context.interface.ts
 * @module @stackra/contracts/interfaces/sync
 * @description Context threaded through the push pipeline.
 */

import type { IPushOptions } from "./push-options.interface";
import type { IPushResult } from "./push-result.interface";
import type { ISyncCheckpoint } from "./sync-checkpoint.interface";

/**
 * Context threaded through every stage of the push pipeline.
 */
export interface IPushPipelineContext {
  /** Collection being pushed. */
  collection: string;

  /** Push options (base URL, batch size, timeout). */
  options: IPushOptions;

  /** Result accumulated as the pipeline runs. */
  result: IPushResult;

  /** Checkpoint to persist after a successful push. */
  checkpoint?: ISyncCheckpoint;
}
