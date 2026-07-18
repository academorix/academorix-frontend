/**
 * @file push.service.ts
 * @module @stackra/sync/core/pipelines
 * @description Push pipeline — wraps a single-collection push through
 *   `@stackra/pipeline` so callers can attach middleware for telemetry,
 *   retries, or authorization without editing the service.
 */

import { Pipeline } from '@stackra/pipeline';
import type { IPushOptions, IPushPipelineContext, IPushResult } from '@stackra/contracts';

import type { CheckpointService } from '../services/checkpoint.service';
import type { PushService } from '../services/push.service';

/**
 * Execute a single-collection push through the pipeline.
 *
 * @param pushService - The PushService instance.
 * @param checkpointService - The CheckpointService instance.
 * @param collection - Collection to push.
 * @param options - Push options.
 */
export async function executePushPipeline(
  pushService: PushService,
  checkpointService: CheckpointService,
  collection: string,
  options: IPushOptions
): Promise<IPushResult> {
  const context: IPushPipelineContext = {
    collection,
    options,
    result: { pushed: 0, failed: 0, errors: [] },
  };

  const result = await new Pipeline<IPushPipelineContext, IPushPipelineContext>()
    .send(context)
    .through([
      async (
        ctx: IPushPipelineContext,
        next: (c: IPushPipelineContext) => Promise<IPushPipelineContext>
      ) => {
        if (!ctx.collection) throw new Error('Collection is required for push');
        if (!ctx.options.baseUrl) throw new Error('baseUrl is required for push');
        return next(ctx);
      },
      async (
        ctx: IPushPipelineContext,
        next: (c: IPushPipelineContext) => Promise<IPushPipelineContext>
      ) => {
        ctx.result = await pushService.push(ctx.collection, ctx.options);
        return next(ctx);
      },
      async (
        ctx: IPushPipelineContext,
        next: (c: IPushPipelineContext) => Promise<IPushPipelineContext>
      ) => {
        if (ctx.result.pushed > 0) {
          ctx.checkpoint = {
            collection: ctx.collection,
            pullCursor: null,
            lastPullAt: null,
            lastPushAt: new Date(),
            lastSyncAt: new Date(),
            lastSyncCount: ctx.result.pushed,
            createdAt: new Date(),
            version: 1,
          };
        }
        return next(ctx);
      },
      async (
        ctx: IPushPipelineContext,
        next: (c: IPushPipelineContext) => Promise<IPushPipelineContext>
      ) => {
        if (ctx.checkpoint) {
          await checkpointService.save(ctx.collection, ctx.checkpoint);
        }
        return next(ctx);
      },
    ])
    .then((ctx) => ctx as IPushPipelineContext);

  return result.result;
}
