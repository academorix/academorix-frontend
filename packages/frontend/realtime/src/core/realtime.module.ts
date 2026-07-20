/**
 * @file realtime.module.ts
 * @module @stackra/realtime/core
 * @description DI module for the realtime system.
 *   Registers RealtimeManager globally. Drivers registered via forFeature().
 */

import { Module, type DynamicModule } from "@stackra/container";
import { createSeedLoader, seedLoaderToken } from "@stackra/support";
import type { IAsyncModuleOptions } from "@stackra/contracts";
import { REALTIME_MANAGER, REALTIME_CONFIG } from "@stackra/contracts";
import { RealtimeManager } from "./services/realtime-manager.service";
import type { IRealtimeModuleOptions } from "./interfaces";
import { mergeConfig } from "./utils/merge-config.util";

/**
 * Realtime DI module.
 *
 * @example
 * ```typescript
 * @Module({
 *   imports: [
 *     RealtimeModule.forRoot({
 *       default: 'main',
 *       connections: { main: { driver: 'socketio', url: 'wss://api.example.com' } },
 *     }),
 *     RealtimeModule.forFeature('socketio', SocketIoConnector),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
export class RealtimeModule {
  /**
   * Configure the realtime module with static config.
   *
   * @param config - Realtime module configuration
   * @returns Dynamic module definition
   */
  public static forRoot(config: IRealtimeModuleOptions): DynamicModule {
    const merged = mergeConfig(config);

    return {
      module: RealtimeModule,
      global: true,
      providers: [
        { provide: REALTIME_CONFIG, useValue: merged },
        RealtimeManager,
        { provide: REALTIME_MANAGER, useExisting: RealtimeManager },
      ],
      exports: [REALTIME_CONFIG, REALTIME_MANAGER, RealtimeManager],
    };
  }

  /**
   * Configure the realtime module with async factory.
   *
   * @param options - Async options with useFactory and inject
   * @returns Dynamic module definition
   */
  public static forRootAsync(options: IAsyncModuleOptions<IRealtimeModuleOptions>): DynamicModule {
    return {
      module: RealtimeModule,
      global: true,
      providers: [
        {
          provide: REALTIME_CONFIG,
          useFactory: async (...args: unknown[]) => mergeConfig(await options.useFactory(...args)),
          inject: options.inject ?? [],
        },
        RealtimeManager,
        { provide: REALTIME_MANAGER, useExisting: RealtimeManager },
      ],
      exports: [REALTIME_CONFIG, REALTIME_MANAGER, RealtimeManager],
    };
  }

  /**
   * Register a connector for a specific driver name.
   *
   * The connector is instantiated via DI and registered on the
   * RealtimeManager via `extend(driver, factory)`.
   *
   * @param driver - Driver name (e.g., 'socketio', 'pusher')
   * @param connectorType - Connector class implementing IRealtimeConnector
   * @returns Dynamic module definition
   */
  public static forFeature(driver: string, connectorType: Function): DynamicModule;
  public static forFeature(connectors: Record<string, Function>): DynamicModule;
  public static forFeature(
    driverOrConnectors: string | Record<string, Function>,
    connectorType?: Function,
  ): DynamicModule {
    const entries: [string, Function][] =
      typeof driverOrConnectors === "string"
        ? [[driverOrConnectors, connectorType as Function]]
        : Object.entries(driverOrConnectors);

    return {
      module: RealtimeModule,
      providers: entries.flatMap(([driver, ctor]) => [
        ctor as any,
        {
          provide: seedLoaderToken(`realtime-connector:${driver}`),
          // The connector's connect() runs when the connection is first resolved.
          useFactory: (manager: RealtimeManager, connector: any) =>
            createSeedLoader(() => manager.registerConnection(driver, connector)),
          inject: [RealtimeManager, ctor as any],
        },
      ]),
      exports: entries.map(([, ctor]) => ctor as any),
    };
  }
}
