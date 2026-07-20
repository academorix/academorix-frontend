/**
 * @file sync-devtools-panel-view.interface.ts
 * @module @stackra/sync/react/devtools
 * @description Props interface for {@link SyncDevtoolsPanelView} —
 *   the React body of the `@stackra/devtools` sync panel.
 */

import type { OperationQueue } from "@/core/services/operation-queue.service";
import type { SyncEngine } from "@/core/services/sync-engine.service";

/**
 * Props accepted by {@link SyncDevtoolsPanelView}.
 */
export interface SyncDevtoolsPanelViewProps {
  /**
   * The {@link SyncEngine} — optional so the view renders an
   * empty-state card in apps that installed `@stackra/sync` but
   * haven't wired `SyncModule.forRoot()`. When present the view
   * subscribes to the engine's `state$` observable via
   * `useSyncExternalStore`.
   */
  readonly engine?: SyncEngine;

  /**
   * The {@link OperationQueue} — optional for the same reason as
   * {@link SyncDevtoolsPanelViewProps.engine}. When present the view
   * subscribes to `stats$` for the per-status counts.
   */
  readonly queue?: OperationQueue;
}
