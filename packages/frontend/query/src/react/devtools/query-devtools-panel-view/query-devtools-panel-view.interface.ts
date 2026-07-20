/**
 * @file query-devtools-panel-view.interface.ts
 * @module @stackra/query/react/devtools
 * @description Props interface for {@link QueryDevtoolsPanelView} —
 *   the React body of the `@stackra/devtools` query panel.
 */

import type { QueryClient } from "@tanstack/query-core";
import type { IUndoableQueue } from "@stackra/contracts";

/**
 * Props accepted by {@link QueryDevtoolsPanelView}.
 */
export interface QueryDevtoolsPanelViewProps {
  /**
   * The TanStack Query `QueryClient` — optional so the view renders
   * an empty-state card in apps that installed `@stackra/query` but
   * haven't wired `QueryModule.forRoot()`. When present the view
   * subscribes to the query + mutation caches via the client's
   * `cache.subscribe()` API.
   */
  readonly queryClient?: QueryClient;

  /**
   * The {@link IUndoableQueue} — optional for the same reason as
   * {@link QueryDevtoolsPanelViewProps.queryClient}. When present the
   * view subscribes to `queue.subscribe(...)` for the pending
   * undoable-mutation list.
   */
  readonly undoable?: IUndoableQueue;
}
