/**
 * @file use-sync-status.hook.ts
 * @module @stackra/sync/react/hooks
 * @description React hook that surfaces the sync engine's live state —
 *   online status, pending count, syncing flag — plus manual controls.
 */

import { useCallback, useEffect, useState } from 'react';
import { useInject } from '@stackra/container/react';
import { NETWORK_DETECTOR, OPERATION_QUEUE, SYNC_ENGINE } from '@stackra/contracts';
import type { NetworkDetector } from '@/core/services/network-detector.service';
import type { OperationQueue } from '@/core/services/operation-queue.service';
import type { SyncEngine } from '@/core/services/sync-engine.service';

/**
 * Result returned by {@link useSyncStatus}.
 */
export interface IUseSyncStatusResult {
  /** Whether the device is currently online. */
  isOnline: boolean;
  /** Number of operations pending in the outbox queue. */
  pendingCount: number;
  /** Whether a sync operation is currently in progress. */
  isSyncing: boolean;
  /** Timestamp of the last successful sync, or `null` when never synced. */
  lastSyncAt: Date | null;
  /** Trigger a manual full sync. */
  triggerSync: () => Promise<void>;
  /** Clear every pending operation (discards unsynced changes). */
  clearQueue: () => Promise<void>;
}

/**
 * React hook that surfaces the sync engine's live state to UI components.
 *
 * @example
 * ```tsx
 * const { isOnline, pendingCount, isSyncing, triggerSync } = useSyncStatus();
 * ```
 */
export function useSyncStatus(): IUseSyncStatusResult {
  const syncEngine = useInject<SyncEngine>(SYNC_ENGINE);
  const networkDetector = useInject<NetworkDetector>(NETWORK_DETECTOR);
  const operationQueue = useInject<OperationQueue>(OPERATION_QUEUE);

  const [isOnline, setIsOnline] = useState<boolean>(() => networkDetector.isOnline());
  const [pendingCount, setPendingCount] = useState<number>(() => operationQueue.getStats().pending);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);

  useEffect(() => {
    const networkSub = networkDetector.status$.subscribe((status) => {
      setIsOnline(status.isOnline);
    });

    const stateSub = syncEngine.state$.subscribe((state) => {
      setIsSyncing(state.isSyncing);
      setPendingCount(state.totalPendingOperations);
      if (state.lastSyncAt) setLastSyncAt(state.lastSyncAt);
    });

    const statsSub = operationQueue.stats$.subscribe((stats) => {
      setPendingCount(stats.pending);
    });

    return () => {
      networkSub.unsubscribe();
      stateSub.unsubscribe();
      statsSub.unsubscribe();
    };
  }, [syncEngine, networkDetector, operationQueue]);

  const triggerSync = useCallback(async (): Promise<void> => {
    await syncEngine.fullSync();
  }, [syncEngine]);

  const clearQueue = useCallback(async (): Promise<void> => {
    await operationQueue.clear();
    setPendingCount(0);
  }, [operationQueue]);

  return { isOnline, pendingCount, isSyncing, lastSyncAt, triggerSync, clearQueue };
}
