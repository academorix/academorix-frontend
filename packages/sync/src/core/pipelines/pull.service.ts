/**
 * @file pull.service.ts
 * @module @stackra/sync/core/pipelines
 * @description Pull pipeline — wraps a single-collection pull through
 *   `@stackra/pipeline` so callers can attach middleware for telemetry,
 *   retries, or authorization without editing the service.
 */

import { Pipeline } from '@stackra/pipeline';
import type { IPullOptions, IPullPipelineContext, IPullResult } from '@stackra/contracts';

import type { CheckpointService } from '../services/checkpoint.service';
import type { PullService } from '../services/pull.service';

/**
 * Execute a single-collection pull through the pipeline.
 *
 * @param pullService - The PullService instance.
 * @param checkpointService - The CheckpointService instance.
 * @param collection - Collection to pull.
 * @param options - Pull options.
 */
export async function executePullPipeline(
  pullService: PullService,
  checkpointService: CheckpointService,
  collection: string,
  options: IPullOptions
): Promise<IPullResult> {
  const context: IPullPipelineContext = {
    collection,
    options,
    result: { pulled: 0, conflicts: 0, nextCursor: null },
  };

  const result = await new Pipeline<IPullPipelineContext, IPullPipelineContext>()
    .send(context)
    .through([
      async (
        ctx: IPullPipelineContext,
        next: (c: IPullPipelineContext) => Promise<IPullPipelineContext>
      ) => {
        if (!ctx.collection) throw new Error('Collection is required for pull');
        if (!ctx.options.baseUrl) throw new Error('baseUrl is required for pull');
        return next(ctx);
      },
      async (
        ctx: IPullPipelineContext,
        next: (c: IPullPipelineContext) => Promise<IPullPipelineContext>
      ) => {
        ctx.result = await pullService.pull(ctx.collection, ctx.options);
        return next(ctx);
      },
      async (
        ctx: IPullPipelineContext,
        next: (c: IPullPipelineContext) => Promise<IPullPipelineContext>
      ) => {
        ctx.checkpoint = {
          collection: ctx.collection,
          pullCursor: ctx.result.nextCursor,
          lastPullAt: new Date(),
          lastPushAt: null,
          lastSyncAt: new Date(),
          lastSyncCount: ctx.result.pulled,
          createdAt: new Date(),
          version: 1,
        };
        return next(ctx);
      },
      async (
        ctx: IPullPipelineContext,
        next: (c: IPullPipelineContext) => Promise<IPullPipelineContext>
      ) => {
        if (ctx.checkpoint) {
          await checkpointService.save(ctx.collection, ctx.checkpoint);
        }
        return next(ctx);
      },
    ])
    .then((ctx) => ctx as IPullPipelineContext);

  return result.result;
}
