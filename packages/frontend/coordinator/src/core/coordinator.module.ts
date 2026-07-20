/**
 * @file coordinator.module.ts
 * @module @stackra/coordinator/core
 * @description DI module for cross-tab coordination.
 */

import { Module, type DynamicModule } from "@stackra/container";
import type { IAsyncModuleOptions } from "@stackra/contracts";
import { COORDINATOR_CONFIG, TAB_COORDINATOR, TAB_TRANSPORT_MANAGER } from "@stackra/contracts";
import { TAB_LOCK_MANAGER } from "./constants";
import { TabCoordinator } from "./services/tab-coordinator.service";
import { LockManager } from "./services/lock-manager.service";
import { CoordinatorTransport } from "./services/coordinator-transport.service";
import { TabTransportManager } from "./services/tab-transport-manager.service";
import type { ICoordinatorModuleOptions } from "./interfaces";
import { mergeConfig } from "./utils/merge-config.util";

/**
 * Coordinator DI module — cross-tab leader election and distributed locks.
 *
 * @example
 * ```typescript
 * @Module({
 *   imports: [
 *     CoordinatorModule.forRoot({
 *       channelName: 'my-pos-app',
 *       heartbeatMs: 1000,
 *       broadcastPatterns: ['sync:**', 'auth:**'],
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
export class CoordinatorModule {
  /**
   * Configure the coordinator module.
   *
   * @param options - Coordinator configuration
   * @returns Dynamic module definition
   */
  public static forRoot(options?: ICoordinatorModuleOptions): DynamicModule {
    const config = mergeConfig(options);

    return {
      module: CoordinatorModule,
      global: true,
      providers: [
        { provide: COORDINATOR_CONFIG, useValue: config },
        TabTransportManager,
        { provide: TAB_TRANSPORT_MANAGER, useExisting: TabTransportManager },
        TabCoordinator,
        { provide: TAB_COORDINATOR, useExisting: TabCoordinator },
        LockManager,
        { provide: TAB_LOCK_MANAGER, useExisting: LockManager },
        CoordinatorTransport,
      ],
      exports: [
        COORDINATOR_CONFIG,
        TabTransportManager,
        TAB_TRANSPORT_MANAGER,
        TabCoordinator,
        TAB_COORDINATOR,
        LockManager,
        TAB_LOCK_MANAGER,
        CoordinatorTransport,
      ],
    };
  }

  /**
   * Configure with async factory.
   *
   * @param options - Async options with useFactory and inject
   * @returns Dynamic module definition
   */
  public static forRootAsync(
    options: IAsyncModuleOptions<ICoordinatorModuleOptions>,
  ): DynamicModule {
    return {
      module: CoordinatorModule,
      global: true,
      providers: [
        {
          provide: COORDINATOR_CONFIG,
          useFactory: async (...args: unknown[]) => mergeConfig(await options.useFactory(...args)),
          inject: options.inject ?? [],
        },
        TabTransportManager,
        { provide: TAB_TRANSPORT_MANAGER, useExisting: TabTransportManager },
        TabCoordinator,
        { provide: TAB_COORDINATOR, useExisting: TabCoordinator },
        LockManager,
        { provide: TAB_LOCK_MANAGER, useExisting: LockManager },
        CoordinatorTransport,
      ],
      exports: [
        COORDINATOR_CONFIG,
        TabTransportManager,
        TAB_TRANSPORT_MANAGER,
        TabCoordinator,
        TAB_COORDINATOR,
        LockManager,
        TAB_LOCK_MANAGER,
        CoordinatorTransport,
      ],
    };
  }
}
