/**
 * @file index.ts
 * @module @stackra/sync/core/pipelines
 * @description Sync pipelines barrel export. Contexts (`IPullPipelineContext`,
 *   `IPushPipelineContext`, `IFullSyncPipelineContext`) live in
 *   `@stackra/contracts` — consumers import those directly.
 */

export { executePullPipeline } from './pull.service';
export { executePushPipeline } from './push.service';
export { executeFullSyncPipeline } from './full-sync.service';
