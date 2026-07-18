/**
 * @file sync.devtools-panel.ts
 * @module @stackra/sync/react/devtools
 * @description The `@stackra/devtools` panel contribution for
 *   `@stackra/sync`.
 *
 *   Surfaces the sync engine's aggregate state (online / syncing,
 *   total pending, last sync timestamp) and the operation queue's
 *   status counts. Read-only — pausing / resuming sync happens
 *   through the built-in Actions panel, not here. Registered by
 *   `SyncModule.forRoot()` / `SyncModule.forRootAsync()` via
 *   `DevtoolsModule.forFeature([...])`.
 */

import { createElement, type ReactNode } from 'react';
import { ArrowsRightLeftIcon } from '@stackra/ui/icons/heroicon/outline';
import { Inject, Injectable, Optional } from '@stackra/container';
import {
  OPERATION_QUEUE,
  SYNC_ENGINE,
  type DevtoolsCategory,
  type IDevtoolsPanel,
  type IDevtoolsView,
} from '@stackra/contracts';

import { DevtoolsPanel } from '@stackra/devtools';

import type { OperationQueue } from '@/core/services/operation-queue.service';
import type { SyncEngine } from '@/core/services/sync-engine.service';
import { SyncDevtoolsPanelView } from './sync-devtools-panel-view';

/**
 * The devtools sync panel.
 *
 * @example
 * ```typescript
 * // Registered automatically inside SyncModule.forRoot().
 * imports: [
 *   DevtoolsModule.forRoot(),
 *   SyncModule.forRoot({
 *     baseUrl: 'https://api.example.com',
 *     defaultStrategy: ConflictStrategy.LastWriteWins,
 *   }),
 * ]
 * ```
 */
@Injectable()
@DevtoolsPanel({
  id: 'sync',
  title: 'Sync',
  category: 'data',
  order: 50,
})
export class SyncDevtoolsPanel implements IDevtoolsPanel {
  /** @inheritdoc */
  public readonly id = 'sync';
  /** @inheritdoc */
  public readonly title = 'Sync';
  /** @inheritdoc */
  public readonly category: DevtoolsCategory = 'data';
  /** @inheritdoc */
  public readonly order = 50;
  /** @inheritdoc */
  public readonly icon: ReactNode = createElement(ArrowsRightLeftIcon, {
    className: 'size-4',
  });
  /** @inheritdoc */
  public readonly view: IDevtoolsView;

  /**
   * @param engine - The {@link SyncEngine} — optional so the panel
   *   resolves in apps that installed `@stackra/sync` but haven't
   *   wired `SyncModule.forRoot()`.
   * @param queue - The {@link OperationQueue} — optional for the
   *   same reason. Used for the per-status counts (pending /
   *   processing / completed / failed).
   */
  public constructor(
    @Optional() @Inject(SYNC_ENGINE) private readonly engine?: SyncEngine,
    @Optional() @Inject(OPERATION_QUEUE) private readonly queue?: OperationQueue
  ) {
    this.view = {
      type: 'component',
      render: (): ReactNode =>
        createElement(SyncDevtoolsPanelView, {
          engine: this.engine,
          queue: this.queue,
        }),
    };
  }

  /**
   * The nav-rail badge counter — the number of pending operations
   * awaiting sync. Returns `null` when the queue is empty or the
   * sync module isn't wired so the badge stays hidden.
   */
  public badge(): number | null {
    // fail-soft — a broken queue must not throw here.
    try {
      const pending = this.queue?.getStats().pending ?? 0;
      return pending > 0 ? pending : null;
    } catch {
      return null;
    }
  }
}
