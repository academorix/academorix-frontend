/**
 * @file sync.module.ts
 * @module @stackra/sync
 * @description DI module for the offline-first sync system.
 *
 *   Registers every sync service under its contracts-owned token:
 *   `SyncEngine`, `PullService`, `PushService`, `MergeService`,
 *   `ConflictResolver`, `NetworkDetector`, `OperationQueue`, and
 *   `CheckpointService`. Config is merged through `mergeConfig` — no
 *   service resolves defaults inline. Follows the `HttpModule.forRoot`
 *   pattern: providers + `useExisting` aliases + a `useValue` config only.
 */

import { Global, Module, type DynamicModule } from "@stackra/container";
import { DevtoolsModule } from "@stackra/devtools";
import type { IAsyncModuleOptions, ISyncModuleOptions } from "@stackra/contracts";
import {
  CHECKPOINT_SERVICE,
  CONFLICT_RESOLVER,
  CONFLICT_RESOLVER_CONFIG,
  LOCAL_STORAGE_ADAPTER,
  MERGE_SERVICE,
  NETWORK_DETECTOR,
  NETWORK_DETECTOR_CONFIG,
  OPERATION_QUEUE,
  OPERATION_QUEUE_CONFIG,
  PULL_SERVICE,
  PUSH_SERVICE,
  SYNC_CONFIG,
  SYNC_ENGINE,
} from "@stackra/contracts";

import { mergeConfig } from "./utils/merge-config.util";
import { NetworkDetector } from "./services/network-detector.service";
import { OperationQueue } from "./services/operation-queue.service";
import { ConflictResolver } from "./resolvers/conflict.resolver";
import { SyncEngine } from "./services/sync-engine.service";
import { PullService } from "./services/pull.service";
import { PushService } from "./services/push.service";
import { MergeService } from "./services/merge.service";
import { CheckpointService } from "./services/checkpoint.service";
import { SyncDevtoolsPanel } from "../react/devtools/sync.devtools-panel";

/**
 * SyncModule — configures every sync service in one call.
 *
 * @example
 * ```typescript
 * import { Module } from '@stackra/container';
 * import { HttpModule } from '@stackra/http';
 * import { NetworkModule } from '@stackra/network';
 * import { CoordinatorModule } from '@stackra/coordinator';
 * import { SyncModule } from '@stackra/sync';
 * import { ConflictStrategy } from '@stackra/contracts';
 *
 * @Module({
 *   imports: [
 *     HttpModule.forRoot({ ... }),
 *     NetworkModule.forRoot({ ... }),
 *     CoordinatorModule.forRoot({ ... }),
 *     SyncModule.forRoot({
 *       baseUrl: 'https://api.example.com',
 *       defaultStrategy: ConflictStrategy.LastWriteWins,
 *       autoSyncInterval: 60_000,
 *       autoSyncOnReconnect: true,
 *       batchSize: 50,
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Global()
@Module({})
export class SyncModule {
  /**
   * Register the sync module globally with a static configuration.
   */
  public static forRoot(options: ISyncModuleOptions): DynamicModule {
    const config = mergeConfig(options);

    return {
      module: SyncModule,
      global: true,
      // Contribute the devtools sync panel. `DevtoolsModule.forFeature`
      // is fail-soft — when the consumer app hasn't wired
      // `DevtoolsModule.forRoot()` the seed loader becomes a no-op
      // and the panel doesn't appear anywhere.
      imports: [DevtoolsModule.forFeature([SyncDevtoolsPanel])],
      providers: [
        // ── Configuration ──────────────────────────────────────────────
        { provide: SYNC_CONFIG, useValue: config },

        // Consumer-supplied local storage adapter (optional — apps may
        // register it separately under LOCAL_STORAGE_ADAPTER instead).
        ...(config.localStorageAdapter
          ? [{ provide: LOCAL_STORAGE_ADAPTER, useValue: config.localStorageAdapter }]
          : []),

        // ── Sub-config slices ─────────────────────────────────────────
        {
          provide: CONFLICT_RESOLVER_CONFIG,
          useValue: {
            defaultStrategy: config.defaultStrategy,
            collectionStrategies: config.strategies,
          },
        },
        {
          provide: NETWORK_DETECTOR_CONFIG,
          useValue: config.networkDetector ?? {},
        },
        {
          provide: OPERATION_QUEUE_CONFIG,
          useValue: {
            enablePersistence: config.enableQueuePersistence,
            maxRetries: config.maxRetries,
          },
        },

        // ── Services + token aliases ───────────────────────────────────
        NetworkDetector,
        { provide: NETWORK_DETECTOR, useExisting: NetworkDetector },
        OperationQueue,
        { provide: OPERATION_QUEUE, useExisting: OperationQueue },
        ConflictResolver,
        { provide: CONFLICT_RESOLVER, useExisting: ConflictResolver },
        CheckpointService,
        { provide: CHECKPOINT_SERVICE, useExisting: CheckpointService },
        MergeService,
        { provide: MERGE_SERVICE, useExisting: MergeService },
        PullService,
        { provide: PULL_SERVICE, useExisting: PullService },
        PushService,
        { provide: PUSH_SERVICE, useExisting: PushService },
        SyncEngine,
        { provide: SYNC_ENGINE, useExisting: SyncEngine },
      ],
      exports: [
        SYNC_CONFIG,
        LOCAL_STORAGE_ADAPTER,
        NETWORK_DETECTOR,
        OPERATION_QUEUE,
        CONFLICT_RESOLVER,
        CHECKPOINT_SERVICE,
        MERGE_SERVICE,
        PULL_SERVICE,
        PUSH_SERVICE,
        SYNC_ENGINE,
      ],
    };
  }

  /**
   * Register the sync module with async factory configuration.
   */
  public static forRootAsync(options: IAsyncModuleOptions<ISyncModuleOptions>): DynamicModule {
    return {
      module: SyncModule,
      global: true,
      imports: [
        // Devtools sync panel — see forRoot for the fail-soft rationale.
        DevtoolsModule.forFeature([SyncDevtoolsPanel]),
      ],
      providers: [
        {
          provide: SYNC_CONFIG,
          useFactory: async (...args: unknown[]) => mergeConfig(await options.useFactory(...args)),
          inject: options.inject ?? [],
        },
        NetworkDetector,
        { provide: NETWORK_DETECTOR, useExisting: NetworkDetector },
        OperationQueue,
        { provide: OPERATION_QUEUE, useExisting: OperationQueue },
        ConflictResolver,
        { provide: CONFLICT_RESOLVER, useExisting: ConflictResolver },
        CheckpointService,
        { provide: CHECKPOINT_SERVICE, useExisting: CheckpointService },
        MergeService,
        { provide: MERGE_SERVICE, useExisting: MergeService },
        PullService,
        { provide: PULL_SERVICE, useExisting: PullService },
        PushService,
        { provide: PUSH_SERVICE, useExisting: PushService },
        SyncEngine,
        { provide: SYNC_ENGINE, useExisting: SyncEngine },
      ],
      exports: [
        SYNC_CONFIG,
        LOCAL_STORAGE_ADAPTER,
        NETWORK_DETECTOR,
        OPERATION_QUEUE,
        CONFLICT_RESOLVER,
        CHECKPOINT_SERVICE,
        MERGE_SERVICE,
        PULL_SERVICE,
        PUSH_SERVICE,
        SYNC_ENGINE,
      ],
    };
  }
}
