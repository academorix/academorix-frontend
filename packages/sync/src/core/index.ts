/**
 * @file index.ts
 * @module @stackra/sync
 * @description Public API for `@stackra/sync`.
 *
 *   Exports only symbols owned by this package. Every token, interface,
 *   enum, and event map lives in `@stackra/contracts` — consumers import
 *   those directly, never through this barrel.
 */

// ============================================================================
// Module
// ============================================================================
export { SyncModule } from './sync.module';

// ============================================================================
// Services (concrete classes — tokens live in @stackra/contracts)
// ============================================================================
export {
  CheckpointService,
  MergeService,
  NetworkDetector,
  OperationQueue,
  PullService,
  PushService,
  SyncEngine,
} from './services';

// ============================================================================
// Resolvers + strategies
// ============================================================================
export { ConflictResolver } from './resolvers';
export { lastWriteWins, localWins, remoteWins } from './strategies';

// ============================================================================
// Pipelines
// ============================================================================
export { executePullPipeline, executePushPipeline, executeFullSyncPipeline } from './pipelines';

// ============================================================================
// Errors
// ============================================================================
export { SyncError, ConflictError, NetworkError } from './errors';

// ============================================================================
// Utilities + defaults
// ============================================================================
export { defineConfig, mergeConfig } from './utils';
export { DEFAULT_SYNC_CONFIG } from './constants';
