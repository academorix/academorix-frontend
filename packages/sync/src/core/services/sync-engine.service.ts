/**
 * @file sync-engine.service.ts
 * @module @stackra/sync/core/services
 * @description SyncEngine — bidirectional sync orchestrator.
 *
 *   Coordinates pull (cursor-based) and push (batched with idempotency)
 *   operations, restoring persisted checkpoints on boot and gating
 *   auto-sync behind the {@link ITabCoordinator} leader when present.
 */

import { Inject, Injectable, Optional } from '@stackra/container';
import { BehaviorSubject, type Observable, type Subscription } from 'rxjs';
import type {
  IGlobalSyncState,
  ISyncConfig,
  ISyncModuleOptions,
  ISyncProgress,
  ISyncResult,
  ISyncState,
  ITabCoordinator,
} from '@stackra/contracts';
import {
  CHECKPOINT_SERVICE,
  NETWORK_DETECTOR,
  PULL_SERVICE,
  PUSH_SERVICE,
  SYNC_CONFIG,
  SyncDirection,
  SyncStatus,
  TAB_COORDINATOR,
} from '@stackra/contracts';
import { Logger } from '@stackra/logger';

import { SyncError } from '../errors/sync.error';
import type { CheckpointService } from './checkpoint.service';
import type { NetworkDetector } from './network-detector.service';
import type { PullService } from './pull.service';
import type { PushService } from './push.service';

/**
 * SyncEngine — orchestrates bidirectional synchronization.
 */
@Injectable()
export class SyncEngine {
  private readonly logger = new Logger(SyncEngine.name);
  private readonly config: ISyncConfig;
  private readonly syncStates = new Map<string, ISyncState>();
  private readonly progressSubject = new BehaviorSubject<ISyncProgress | null>(null);
  private readonly stateSubject: BehaviorSubject<IGlobalSyncState>;

  private autoSyncInterval?: ReturnType<typeof setInterval>;
  private networkSubscription?: Subscription;
  private coordinatorSubscription?: Subscription;

  /** Observable that emits progress ticks during any sync operation. */
  public readonly progress$: Observable<ISyncProgress | null> = this.progressSubject.asObservable();

  /** Observable that emits the aggregate global sync state. */
  public readonly state$: Observable<IGlobalSyncState>;

  public constructor(
    @Inject(SYNC_CONFIG) config: ISyncModuleOptions,
    @Inject(NETWORK_DETECTOR) private readonly networkDetector: NetworkDetector,
    @Inject(PULL_SERVICE) private readonly pullService: PullService,
    @Inject(PUSH_SERVICE) private readonly pushService: PushService,
    @Inject(CHECKPOINT_SERVICE) private readonly checkpointService: CheckpointService,
    @Optional() @Inject(TAB_COORDINATOR) private readonly coordinator?: ITabCoordinator
  ) {
    this.config = {
      baseUrl: config.baseUrl,
      endpoints: config.endpoints ?? {},
      autoSyncInterval: config.autoSyncInterval ?? 0,
      autoSyncOnReconnect: config.autoSyncOnReconnect ?? true,
      batchSize: config.batchSize ?? 50,
      timeout: config.timeout ?? 30_000,
      headers: config.headers ?? {},
    };

    this.stateSubject = new BehaviorSubject<IGlobalSyncState>(this.getGlobalState());
    this.state$ = this.stateSubject.asObservable();

    void this.restoreCheckpoints();

    if (this.config.autoSyncOnReconnect) {
      this.setupAutoSyncOnReconnect();
    }
  }

  // ── Public API ──────────────────────────────────────────────────────────

  /**
   * Pull remote changes using cursor pagination.
   */
  public async pullChanges(collections?: string[]): Promise<ISyncResult> {
    const startTime = Date.now();
    const collectionsToSync = this.resolveCollections(collections);
    let totalPulled = 0;
    let totalConflicts = 0;

    try {
      for (let i = 0; i < collectionsToSync.length; i++) {
        const collection = collectionsToSync[i]!;
        const state = this.getOrCreateState(collection);

        this.emitProgress(
          SyncDirection.Pull,
          collection,
          (i / collectionsToSync.length) * 100,
          'Pulling'
        );

        const result = await this.pullService.pull(collection, {
          baseUrl: this.config.baseUrl,
          cursor: state.pullCursor ?? null,
          limit: this.config.batchSize,
          since: state.lastPullAt ?? undefined,
        });

        totalPulled += result.pulled;
        totalConflicts += result.conflicts;

        state.pullCursor = result.nextCursor;
        state.lastPullAt = new Date();
        state.lastSyncAt = new Date();
        state.status = SyncStatus.Idle;
        this.updateState(collection, state);

        await this.checkpointService.save(collection, {
          collection,
          pullCursor: state.pullCursor ?? null,
          lastPullAt: state.lastPullAt,
          lastPushAt: state.lastPushAt,
          lastSyncAt: state.lastSyncAt,
          lastSyncCount: result.pulled,
          createdAt: new Date(),
          version: 1,
        });
      }

      this.emitProgress(SyncDirection.Pull, collectionsToSync[0]!, 100, 'Pull completed');

      return {
        direction: SyncDirection.Pull,
        collections: collectionsToSync,
        pulled: totalPulled,
        pushed: 0,
        conflicts: totalConflicts,
        duration: Date.now() - startTime,
        timestamp: new Date(),
        status: SyncStatus.Completed,
      };
    } catch (error: unknown) {
      throw new SyncError(
        `Pull failed: ${error instanceof Error ? error.message : String(error)}`,
        'PULL_FAILED',
        { collections: collectionsToSync }
      );
    }
  }

  /**
   * Push local changes to the remote in batches with idempotency keys.
   */
  public async pushChanges(collections?: string[]): Promise<ISyncResult> {
    const startTime = Date.now();
    const collectionsToSync = this.resolveCollections(collections);
    let totalPushed = 0;

    try {
      for (let i = 0; i < collectionsToSync.length; i++) {
        const collection = collectionsToSync[i]!;

        this.emitProgress(
          SyncDirection.Push,
          collection,
          (i / collectionsToSync.length) * 100,
          'Pushing'
        );

        const result = await this.pushService.push(collection, {
          baseUrl: this.config.baseUrl,
          batchSize: this.config.batchSize,
          timeout: this.config.timeout,
        });

        totalPushed += result.pushed;

        const state = this.getOrCreateState(collection);
        state.lastPushAt = new Date();
        state.lastSyncAt = new Date();
        state.status = SyncStatus.Idle;
        this.updateState(collection, state);

        await this.checkpointService.save(collection, {
          collection,
          pullCursor: state.pullCursor ?? null,
          lastPullAt: state.lastPullAt,
          lastPushAt: state.lastPushAt,
          lastSyncAt: state.lastSyncAt,
          lastSyncCount: result.pushed,
          createdAt: new Date(),
          version: 1,
        });
      }

      this.emitProgress(SyncDirection.Push, collectionsToSync[0]!, 100, 'Push completed');

      return {
        direction: SyncDirection.Push,
        collections: collectionsToSync,
        pulled: 0,
        pushed: totalPushed,
        conflicts: 0,
        duration: Date.now() - startTime,
        timestamp: new Date(),
        status: SyncStatus.Completed,
      };
    } catch (error: unknown) {
      throw new SyncError(
        `Push failed: ${error instanceof Error ? error.message : String(error)}`,
        'PUSH_FAILED',
        { collections: collectionsToSync }
      );
    }
  }

  /**
   * Full bidirectional sync — push first, then pull.
   */
  public async fullSync(collections?: string[]): Promise<ISyncResult> {
    const startTime = Date.now();
    const collectionsToSync = this.resolveCollections(collections);

    try {
      this.emitProgress(
        SyncDirection.Bidirectional,
        collectionsToSync[0]!,
        0,
        'Starting full sync'
      );

      const pushResult = await this.pushChanges(collectionsToSync);
      this.emitProgress(
        SyncDirection.Bidirectional,
        collectionsToSync[0]!,
        50,
        'Push done, pulling'
      );

      const pullResult = await this.pullChanges(collectionsToSync);
      this.emitProgress(
        SyncDirection.Bidirectional,
        collectionsToSync[0]!,
        100,
        'Full sync completed'
      );

      return {
        direction: SyncDirection.Bidirectional,
        collections: collectionsToSync,
        pulled: pullResult.pulled,
        pushed: pushResult.pushed,
        conflicts: pullResult.conflicts,
        duration: Date.now() - startTime,
        timestamp: new Date(),
        status: SyncStatus.Completed,
      };
    } catch (error: unknown) {
      throw new SyncError(
        `Full sync failed: ${error instanceof Error ? error.message : String(error)}`,
        'FULL_SYNC_FAILED',
        { collections: collectionsToSync }
      );
    }
  }

  /** Reset the sync state for a single collection (forces a full re-sync). */
  public async resetCollection(collection: string): Promise<void> {
    this.syncStates.delete(collection);
    await this.checkpointService.delete(collection);
    this.updateGlobalState();
    this.logger.info(`[SyncEngine] Reset sync state for "${collection}"`);
  }

  /** Reset every collection's sync state. */
  public async resetAll(): Promise<void> {
    const collections = Array.from(this.syncStates.keys());
    this.syncStates.clear();
    await this.checkpointService.deleteAll();
    this.updateGlobalState();
    this.logger.info(`[SyncEngine] Reset all sync state (${collections.length} collections)`);
  }

  /** Start automatic sync — leader-gated when a coordinator is available. */
  public startAutoSync(intervalMs?: number): void {
    const interval = intervalMs ?? this.config.autoSyncInterval;
    if (interval <= 0) {
      throw new SyncError('Auto-sync interval must be > 0', 'INVALID_INTERVAL');
    }

    this.stopAutoSync();

    // No `role$` observable on TabCoordinator — the interval callback checks
    // `isLeader()` on each tick so followers stay quiet without an extra
    // subscription surface.
    this.startInterval(interval);

    this.logger.info(`[SyncEngine] Auto-sync configured (interval: ${interval}ms)`);
  }

  /** Stop automatic sync. */
  public stopAutoSync(): void {
    this.stopInterval();
    this.coordinatorSubscription?.unsubscribe();
    this.coordinatorSubscription = undefined;
  }

  /** Register a collection to be tracked by the engine. */
  public registerCollection(collection: string): void {
    if (!this.syncStates.has(collection)) {
      this.syncStates.set(collection, this.createDefaultState(collection));
      this.updateGlobalState();
    }
  }

  /** Read a collection's tracked sync state. */
  public getCollectionState(collection: string): ISyncState | undefined {
    return this.syncStates.get(collection);
  }

  /** Read the aggregate global sync state. */
  public getSyncStatus(): IGlobalSyncState {
    return this.getGlobalState();
  }

  /** Subscribe to progress ticks. */
  public onSyncProgress(callback: (progress: ISyncProgress) => void): Subscription {
    return this.progress$.subscribe((p) => {
      if (p) callback(p);
    });
  }

  /** Cleanup resources. */
  public destroy(): void {
    this.stopAutoSync();
    this.networkSubscription?.unsubscribe();
    this.progressSubject.complete();
    this.stateSubject.complete();
  }

  // ── Private ─────────────────────────────────────────────────────────────

  private resolveCollections(collections?: string[]): string[] {
    const resolved = collections ?? Array.from(this.syncStates.keys());
    if (resolved.length === 0) {
      throw new SyncError('No collections specified for sync', 'NO_COLLECTIONS');
    }
    return resolved;
  }

  private getOrCreateState(collection: string): ISyncState {
    if (!this.syncStates.has(collection)) this.registerCollection(collection);
    return this.syncStates.get(collection)!;
  }

  private createDefaultState(collection: string): ISyncState {
    return {
      collection,
      status: SyncStatus.Idle,
      isSyncing: false,
      lastSyncAt: null,
      lastPullAt: null,
      lastPushAt: null,
      pendingOperations: 0,
      pullCursor: null,
    };
  }

  private updateState(collection: string, state: ISyncState): void {
    this.syncStates.set(collection, state);
    this.updateGlobalState();
  }

  private getGlobalState(): IGlobalSyncState {
    const collections: Record<string, ISyncState> = {};
    let totalPending = 0;
    let isSyncing = false;
    let lastSyncAt: Date | null = null;

    for (const [name, state] of this.syncStates) {
      collections[name] = state;
      totalPending += state.pendingOperations;
      isSyncing = isSyncing || state.isSyncing;
      if (state.lastSyncAt && (!lastSyncAt || state.lastSyncAt > lastSyncAt)) {
        lastSyncAt = state.lastSyncAt;
      }
    }

    return {
      isOnline: this.networkDetector.isOnline(),
      isSyncing,
      collections,
      totalPendingOperations: totalPending,
      lastSyncAt,
    };
  }

  private updateGlobalState(): void {
    this.stateSubject.next(this.getGlobalState());
  }

  private emitProgress(
    direction: SyncDirection,
    collection: string,
    progress: number,
    operation: string
  ): void {
    this.progressSubject.next({
      direction,
      collection,
      progress,
      operation,
      timestamp: new Date(),
    });
  }

  private startInterval(interval: number): void {
    this.stopInterval();
    this.autoSyncInterval = setInterval(() => {
      const isLeader = this.coordinator ? this.coordinator.isLeader() : true;
      if (!isLeader) return;
      if (this.networkDetector.isOnline()) {
        this.fullSync().catch((e) => this.logger.error('Auto-sync failed', { error: e }));
      }
    }, interval);
  }

  private stopInterval(): void {
    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval);
      this.autoSyncInterval = undefined;
    }
  }

  private setupAutoSyncOnReconnect(): void {
    this.networkSubscription = this.networkDetector.status$.subscribe((status) => {
      const isLeader = this.coordinator ? this.coordinator.isLeader() : true;
      if (status.isOnline && isLeader) {
        this.logger.info('[SyncEngine] Network reconnected — triggering sync');
        this.fullSync().catch((e) => this.logger.error('Reconnect sync failed', { error: e }));
      }
    });
  }

  private async restoreCheckpoints(): Promise<void> {
    try {
      const checkpoints = await this.checkpointService.loadAll();
      for (const cp of checkpoints) {
        this.syncStates.set(cp.collection, {
          collection: cp.collection,
          status: SyncStatus.Idle,
          isSyncing: false,
          lastSyncAt: cp.lastSyncAt,
          lastPullAt: cp.lastPullAt,
          lastPushAt: cp.lastPushAt,
          pendingOperations: 0,
          pullCursor: cp.pullCursor,
        });
      }
      this.updateGlobalState();
    } catch (error: unknown) {
      this.logger.warn('[SyncEngine] Failed to restore checkpoints', { error });
    }
  }
}
