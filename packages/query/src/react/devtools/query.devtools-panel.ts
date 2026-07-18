/**
 * @file query.devtools-panel.ts
 * @module @stackra/query/react/devtools
 * @description The `@stackra/devtools` panel contribution for
 *   `@stackra/query`.
 *
 *   Surfaces the TanStack Query cache — total cached queries, active
 *   fetches, stale count, mutations in flight — plus the head of the
 *   undoable-mutation queue. Read-only: the panel does not
 *   invalidate, refetch, or cancel — the built-in Actions panel
 *   exposes destructive helpers instead. Registered by
 *   `QueryModule.forRoot()` / `QueryModule.forRootAsync()` via
 *   `DevtoolsModule.forFeature([...])`.
 */

import { createElement, type ReactNode } from 'react';
import { MagnifyingGlassCircleIcon } from '@stackra/ui/icons/heroicon/outline';
import { Inject, Injectable, Optional } from '@stackra/container';
import { QueryClient } from '@tanstack/query-core';
import {
  UNDOABLE_QUEUE,
  type DevtoolsCategory,
  type IDevtoolsPanel,
  type IDevtoolsView,
  type IUndoableQueue,
} from '@stackra/contracts';

import { DevtoolsPanel } from '@stackra/devtools';

import { QueryDevtoolsPanelView } from './query-devtools-panel-view';

/**
 * The devtools query panel.
 *
 * @example
 * ```typescript
 * // Registered automatically inside QueryModule.forRoot().
 * imports: [
 *   DevtoolsModule.forRoot(),
 *   QueryModule.forRoot(),
 * ]
 * ```
 */
@Injectable()
@DevtoolsPanel({
  id: 'query',
  title: 'Query',
  category: 'data',
  order: 60,
})
export class QueryDevtoolsPanel implements IDevtoolsPanel {
  /** @inheritdoc */
  public readonly id = 'query';
  /** @inheritdoc */
  public readonly title = 'Query';
  /** @inheritdoc */
  public readonly category: DevtoolsCategory = 'data';
  /** @inheritdoc */
  public readonly order = 60;
  /** @inheritdoc */
  public readonly icon: ReactNode = createElement(MagnifyingGlassCircleIcon, {
    className: 'size-4',
  });
  /** @inheritdoc */
  public readonly view: IDevtoolsView;

  /**
   * @param queryClient - The TanStack Query `QueryClient` — optional
   *   so the panel resolves in apps that installed `@stackra/query`
   *   but haven't wired `QueryModule.forRoot()`.
   * @param undoable - The {@link IUndoableQueue} — optional for the
   *   same reason. Used to surface pending undoable mutations.
   */
  public constructor(
    @Optional() @Inject(QueryClient) private readonly queryClient?: QueryClient,
    @Optional() @Inject(UNDOABLE_QUEUE) private readonly undoable?: IUndoableQueue
  ) {
    this.view = {
      type: 'component',
      render: (): ReactNode =>
        createElement(QueryDevtoolsPanelView, {
          queryClient: this.queryClient,
          undoable: this.undoable,
        }),
    };
  }

  /**
   * The nav-rail badge counter — the number of mutations currently
   * in flight (`getMutationCache().getAll().filter(m =>
   * m.state.status === 'pending')`). Returns `null` when nothing is
   * pending or the query client isn't wired.
   */
  public badge(): number | null {
    // fail-soft — a broken client / cache must not throw here.
    try {
      const mutations = this.queryClient?.getMutationCache().getAll() ?? [];
      // TanStack Query v5 mutation states: 'idle' | 'pending' | 'success' | 'error'.
      const pending = mutations.filter((m) => m.state.status === 'pending').length;
      // Also count queued undoable mutations — they represent
      // pending writes from the user's perspective even though the
      // network request hasn't started yet.
      const undoablePending = this.undoable?.getPending().length ?? 0;
      const total = pending + undoablePending;
      return total > 0 ? total : null;
    } catch {
      return null;
    }
  }
}
