/**
 * @file job-handler.interface.ts
 * @module @stackra/queue/core/interfaces
 * @description Type definition for the job handler function.
 */

import type { IQueuedJob } from "./queued-job.interface";

/**
 * Function signature for a job processor handler.
 *
 * Receives a queued job and processes it. Must resolve when complete
 * or reject to signal failure.
 */
export type JobHandler = (job: IQueuedJob) => Promise<void>;
