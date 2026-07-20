/**
 * @file full-sync.service.ts
 * @module @stackra/sync/core/pipelines
 * @description Full-sync pipeline — orchestrates push then pull across
 *   every requested collection through `@stackra/pipeline`.
 */

import { Pipeline } from "@stackra/pipeline";
import type {
  IFullSyncPipelineContext,
  IPullOptions,
  IPushOptions,
  ISyncResult,
} from "@stackra/contracts";
import { SyncDirection, SyncStatus } from "@stackra/contracts";

import type { CheckpointService } from "../services/checkpoint.service";
import type { PullService } from "../services/pull.service";
import type { PushService } from "../services/push.service";

/**
 * Execute a full bidirectional sync (push then pull) through the pipeline.
 */
export async function executeFullSyncPipeline(
  pullService: PullService,
  pushService: PushService,
  checkpointService: CheckpointService,
  collections: string[],
  pullOptionsFactory: (collection: string) => IPullOptions,
  pushOptionsFactory: (collection: string) => IPushOptions,
): Promise<ISyncResult> {
  const context: IFullSyncPipelineContext = {
    collections,
    pullOptionsFactory,
    pushOptionsFactory,
    startTime: Date.now(),
    result: {
      direction: SyncDirection.Bidirectional,
      collections,
      pulled: 0,
      pushed: 0,
      conflicts: 0,
      duration: 0,
      timestamp: new Date(),
      status: SyncStatus.Completed,
    },
  };

  const finalContext = await new Pipeline<IFullSyncPipelineContext, IFullSyncPipelineContext>()
    .send(context)
    .through([
      async (
        ctx: IFullSyncPipelineContext,
        next: (c: IFullSyncPipelineContext) => Promise<IFullSyncPipelineContext>,
      ) => {
        for (const collection of ctx.collections) {
          const pushResult = await pushService.push(collection, ctx.pushOptionsFactory(collection));
          ctx.result.pushed += pushResult.pushed;
          if (pushResult.pushed > 0) {
            await checkpointService.save(collection, {
              collection,
              pullCursor: null,
              lastPullAt: null,
              lastPushAt: new Date(),
              lastSyncAt: new Date(),
              lastSyncCount: pushResult.pushed,
              createdAt: new Date(),
              version: 1,
            });
          }
        }
        return next(ctx);
      },
      async (
        ctx: IFullSyncPipelineContext,
        next: (c: IFullSyncPipelineContext) => Promise<IFullSyncPipelineContext>,
      ) => {
        for (const collection of ctx.collections) {
          const pullResult = await pullService.pull(collection, ctx.pullOptionsFactory(collection));
          ctx.result.pulled += pullResult.pulled;
          ctx.result.conflicts += pullResult.conflicts;
          await checkpointService.save(collection, {
            collection,
            pullCursor: pullResult.nextCursor,
            lastPullAt: new Date(),
            lastPushAt: null,
            lastSyncAt: new Date(),
            lastSyncCount: pullResult.pulled,
            createdAt: new Date(),
            version: 1,
          });
        }
        return next(ctx);
      },
      async (
        ctx: IFullSyncPipelineContext,
        next: (c: IFullSyncPipelineContext) => Promise<IFullSyncPipelineContext>,
      ) => {
        ctx.result.duration = Date.now() - ctx.startTime;
        ctx.result.timestamp = new Date();
        return next(ctx);
      },
    ])
    .then((ctx) => ctx as IFullSyncPipelineContext);

  return finalContext.result;
}
