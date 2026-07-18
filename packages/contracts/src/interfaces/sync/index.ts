/**
 * @file index.ts
 * @module @stackra/contracts/interfaces/sync
 * @description Barrel export for the offline-first sync contract.
 *   Consumers of `@stackra/sync` import every SDUI-relevant interface from
 *   here — the runtime package re-exports nothing owned by contracts.
 */

export type { ISyncModuleOptions } from "./sync-module-options.interface";
export type { ISyncConfig } from "./sync-config.interface";
export type { ISyncState } from "./sync-state.interface";
export type { IGlobalSyncState } from "./global-sync-state.interface";
export type { ISyncProgress } from "./sync-progress.interface";
export type { ISyncResult } from "./sync-result.interface";
export type { ISyncCheckpoint } from "./sync-checkpoint.interface";

export type { ILocalStorageAdapter } from "./local-storage-adapter.interface";

export type { IConflict } from "./conflict.interface";
export type { IConflictResolution } from "./conflict-resolution.interface";
export type { IConflictResolverConfig } from "./conflict-resolver-config.interface";
export type { IConflictResolverFn } from "./conflict-resolver-fn.interface";

export type { IConnectivityCheck } from "./connectivity-check.interface";
export type { INetworkDetectorConfig } from "./network-detector-config.interface";

export type { IOperationQueueConfig } from "./operation-queue-config.interface";
export type { IQueuedOperation } from "./queued-operation.interface";
export type { IBatchOperation } from "./batch-operation.interface";
export type { IQueueStats } from "./queue-stats.interface";
export type { IProcessResult } from "./process-result.interface";

export type { IPullOptions } from "./pull-options.interface";
export type { IPullResult } from "./pull-result.interface";
export type { IPushOptions } from "./push-options.interface";
export type { IPushResult } from "./push-result.interface";

export type { IPullPipelineContext } from "./pull-pipeline-context.interface";
export type { IPushPipelineContext } from "./push-pipeline-context.interface";
export type { IFullSyncPipelineContext } from "./full-sync-pipeline-context.interface";
