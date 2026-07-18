/**
 * @file index.ts
 * @module @stackra/sync/react
 * @description React hooks for `@stackra/sync`. Result-shape interfaces
 *   are exported from here; sync vocabulary (`IConflict`, `IConflictResolution`,
 *   ...) lives in `@stackra/contracts` and is imported from there directly.
 *
 *   Also ships the `@stackra/devtools` panel contribution for
 *   `@stackra/sync`.
 */

export {
  useSyncStatus,
  useConflictResolver,
  type IUseSyncStatusResult,
  type IUseConflictResolverResult,
} from './hooks';

// ════════════════════════════════════════════════════════════════════════════════
// Devtools contribution
// ════════════════════════════════════════════════════════════════════════════════
export {
  SyncDevtoolsPanel,
  SyncDevtoolsPanelView,
  type SyncDevtoolsPanelViewProps,
} from './devtools';
