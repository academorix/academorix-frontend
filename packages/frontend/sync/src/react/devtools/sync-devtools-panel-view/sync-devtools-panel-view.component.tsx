/**
 * @file sync-devtools-panel-view.component.tsx
 * @module @stackra/sync/react/devtools
 * @description React body of the `@stackra/devtools` sync panel.
 *
 *   Two-card layout: (1) engine status card with online / syncing
 *   chips + a summary of per-collection sync state; (2) operation
 *   queue card with four status chips + a table of the most recent
 *   operations. Both cards subscribe to their upstream observables
 *   via `useSyncExternalStore` — the engine exposes `state$` and the
 *   queue exposes `stats$`, both RxJS `BehaviorSubject`s, which give
 *   us the getSnapshot / subscribe pair that
 *   `useSyncExternalStore` needs.
 */

import { type ReactElement, useCallback, useSyncExternalStore } from 'react';
import { Card, Chip } from '@stackra/ui/react';
import {
  OperationStatus,
  type IGlobalSyncState,
  type IQueueStats,
  type IQueuedOperation,
} from '@stackra/contracts';

import type { SyncDevtoolsPanelViewProps } from './sync-devtools-panel-view.interface';

/** Frozen empty state used when the engine is absent. */
const EMPTY_ENGINE_STATE: IGlobalSyncState = Object.freeze({
  isOnline: true,
  isSyncing: false,
  collections: {},
  totalPendingOperations: 0,
  lastSyncAt: null,
});

/** Frozen empty stats used when the queue is absent. */
const EMPTY_QUEUE_STATS: IQueueStats = Object.freeze({
  total: 0,
  pending: 0,
  processing: 0,
  completed: 0,
  failed: 0,
});

/**
 * Format an optional `Date` as a relative timestamp — "just now" for
 * < 1 min, "3m ago", "2h ago", "5d ago", or an ISO date for anything
 * older. Kept as a pure function so React reconciles cleanly.
 */
function formatRelative(date: Date | null): string {
  if (!date) return 'never';
  const now = Date.now();
  const diffMs = now - date.getTime();
  if (diffMs < 60_000) return 'just now';
  if (diffMs < 3_600_000) return `${Math.floor(diffMs / 60_000)}m ago`;
  if (diffMs < 86_400_000) return `${Math.floor(diffMs / 3_600_000)}h ago`;
  if (diffMs < 604_800_000) return `${Math.floor(diffMs / 86_400_000)}d ago`;
  return date.toISOString().slice(0, 10);
}

/**
 * Hook — subscribe to the engine's `state$` observable via
 * `useSyncExternalStore`.
 *
 * Handles the "no engine" case with a frozen empty state so the
 * hook stays tearing-free.
 */
function useEngineState(engine: SyncDevtoolsPanelViewProps['engine']): IGlobalSyncState {
  const subscribe = useCallback(
    (cb: () => void): (() => void) => {
      if (!engine) return () => undefined;
      const sub = engine.state$.subscribe(() => cb());
      return () => sub.unsubscribe();
    },
    [engine]
  );
  const getSnapshot = useCallback(
    () => (engine ? engine.getSyncStatus() : EMPTY_ENGINE_STATE),
    [engine]
  );
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/**
 * Hook — subscribe to the queue's `stats$` observable via
 * `useSyncExternalStore`.
 */
function useQueueStats(queue: SyncDevtoolsPanelViewProps['queue']): {
  stats: IQueueStats;
  recent: readonly IQueuedOperation[];
} {
  const subscribe = useCallback(
    (cb: () => void): (() => void) => {
      if (!queue) return () => undefined;
      const sub = queue.stats$.subscribe(() => cb());
      return () => sub.unsubscribe();
    },
    [queue]
  );
  const getSnapshot = useCallback(() => (queue ? queue.getStats() : EMPTY_QUEUE_STATS), [queue]);
  const stats = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  // Recent operations aren't emitted through the observable
  // separately — read them from `getAll()` on every stats change.
  // The queue itself keeps the operations in a `Map`, so this is
  // O(n) for very small n. `getAll()` returns a snapshot array so
  // React sees stable identity between renders where the count
  // hasn't changed.
  const recent = queue ? queue.getAll().slice(0, 10) : [];
  return { stats, recent };
}

/**
 * Map an operation status to a HeroUI `Chip` variant. Kept pure so
 * chip identity is stable.
 */
function statusVariant(status: OperationStatus): 'primary' | 'secondary' | 'soft' | 'tertiary' {
  switch (status) {
    case OperationStatus.Processing:
      return 'primary';
    case OperationStatus.Completed:
      return 'soft';
    case OperationStatus.Failed:
      return 'tertiary';
    case OperationStatus.Pending:
    default:
      return 'secondary';
  }
}

/**
 * The sync devtools panel body.
 *
 * @param props - See {@link SyncDevtoolsPanelViewProps}.
 * @returns The panel body — engine status card + operation queue card.
 */
export function SyncDevtoolsPanelView({ engine, queue }: SyncDevtoolsPanelViewProps): ReactElement {
  const state = useEngineState(engine);
  const { stats, recent } = useQueueStats(queue);

  if (!engine && !queue) {
    return (
      <div className="flex flex-col gap-3">
        <Card>
          <Card.Header>
            <Card.Title>Sync engine not available</Card.Title>
            <Card.Description>
              Wire <code>SyncModule.forRoot(...)</code> to see live sync state here.
            </Card.Description>
          </Card.Header>
        </Card>
      </div>
    );
  }

  const collectionNames = Object.keys(state.collections);

  return (
    <div className="flex flex-col gap-3">
      <header>
        <h3 className="text-base font-semibold text-foreground">Sync</h3>
        <p className="text-xs text-muted">
          Offline-first synchronisation status. Live counts stream from the engine and operation
          queue.
        </p>
      </header>

      <Card>
        <Card.Header>
          <div className="flex flex-wrap items-center gap-2">
            <Card.Title className="text-sm">Engine</Card.Title>
            <Chip size="sm" variant={state.isOnline ? 'soft' : 'tertiary'}>
              <Chip.Label>{state.isOnline ? 'online' : 'offline'}</Chip.Label>
            </Chip>
            <Chip size="sm" variant={state.isSyncing ? 'primary' : 'secondary'}>
              <Chip.Label>{state.isSyncing ? 'syncing' : 'idle'}</Chip.Label>
            </Chip>
            <Chip size="sm" variant={state.totalPendingOperations > 0 ? 'primary' : 'secondary'}>
              <Chip.Label>{state.totalPendingOperations} pending</Chip.Label>
            </Chip>
          </div>
          <Card.Description>
            Last sync {formatRelative(state.lastSyncAt)} — {collectionNames.length} tracked
            collection{collectionNames.length === 1 ? '' : 's'}.
          </Card.Description>
        </Card.Header>
        {collectionNames.length > 0 ? (
          <Card.Content>
            <ul className="flex flex-col gap-1 text-sm">
              {collectionNames.map((name) => {
                const c = state.collections[name]!;
                return (
                  <li key={name} className="flex items-center justify-between gap-2">
                    <span className="text-foreground">{name}</span>
                    <span className="text-muted">
                      <code className="text-xs">{c.status}</code>
                      {' · '}
                      <code className="text-xs">{c.pendingOperations} pending</code>
                    </span>
                  </li>
                );
              })}
            </ul>
          </Card.Content>
        ) : null}
      </Card>

      <Card>
        <Card.Header>
          <div className="flex flex-wrap items-center gap-2">
            <Card.Title className="text-sm">Operation queue</Card.Title>
            <Chip size="sm" variant="secondary">
              <Chip.Label>{stats.pending} pending</Chip.Label>
            </Chip>
            <Chip size="sm" variant={stats.processing > 0 ? 'primary' : 'secondary'}>
              <Chip.Label>{stats.processing} processing</Chip.Label>
            </Chip>
            <Chip size="sm" variant="soft">
              <Chip.Label>{stats.completed} completed</Chip.Label>
            </Chip>
            <Chip size="sm" variant={stats.failed > 0 ? 'tertiary' : 'secondary'}>
              <Chip.Label>{stats.failed} failed</Chip.Label>
            </Chip>
          </div>
          <Card.Description>
            {stats.total} operation{stats.total === 1 ? '' : 's'} queued. Recent 10 shown below.
          </Card.Description>
        </Card.Header>
        {recent.length > 0 ? (
          <Card.Content>
            <ul className="flex flex-col gap-1 text-sm">
              {recent.map((op) => (
                <li key={op.id} className="flex items-center justify-between gap-2">
                  <span className="truncate text-foreground">
                    <code className="text-xs">{op.type ?? op.id}</code>
                  </span>
                  <Chip size="sm" variant={statusVariant(op.status)}>
                    <Chip.Label>{op.status}</Chip.Label>
                  </Chip>
                </li>
              ))}
            </ul>
          </Card.Content>
        ) : null}
      </Card>
    </div>
  );
}
