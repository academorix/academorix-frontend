/**
 * @file monitoring.module.ts
 * @module @stackra/monitoring/core
 * @description DI module for the monitoring system.
 *
 *   - `forRoot(options)` — binds config, the `MonitoringManager`, and the
 *     discovery loader. Built-in providers (console/Sentry) are seeded by
 *     the manager's own `onModuleInit` from config.
 *   - `forFeature(providerClass)` — registers a custom provider class; a
 *     lifecycle seed loader registers the resolved instance with the
 *     manager during `onApplicationBootstrap` (no factory side effects).
 */

import { Module, type DynamicModule } from '@stackra/container';
import type { IAsyncModuleOptions } from '@stackra/contracts';
import { MONITORING_CONFIG, MONITORING_MANAGER } from '@stackra/contracts';
import type { IMonitoringManager, IMonitoringProvider, Type } from '@stackra/contracts';

import type { IMonitoringModuleOptions } from './interfaces';
import { createSeedLoader, seedLoaderToken } from '@stackra/support';

import { mergeConfig } from './utils/merge-config.util';
import { MonitoringManager } from './services/monitoring-manager.service';
import { MonitoringProviderLoader } from './services/monitoring-provider-loader.service';

/**
 * Monitoring DI module.
 *
 * @example
 * ```typescript
 * @Module({
 *   imports: [
 *     MonitoringModule.forRoot({
 *       environment: 'production',
 *       sentry: { dsn: import.meta.env.VITE_SENTRY_DSN },
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
export class MonitoringModule {
  /**
   * Register the monitoring module globally.
   *
   * @param options - Monitoring configuration.
   * @returns Dynamic module definition.
   */
  public static forRoot(options?: Partial<IMonitoringModuleOptions>): DynamicModule {
    return {
      module: MonitoringModule,
      global: true,
      providers: [
        { provide: MONITORING_CONFIG, useValue: mergeConfig(options) },
        MonitoringManager,
        { provide: MONITORING_MANAGER, useExisting: MonitoringManager },
        MonitoringProviderLoader,
      ],
      exports: [MONITORING_CONFIG, MONITORING_MANAGER, MonitoringManager],
    };
  }

  /**
   * Register the monitoring module with async configuration.
   *
   * @param options - Async factory options.
   * @returns Dynamic module definition.
   */
  public static forRootAsync(
    options: IAsyncModuleOptions<Partial<IMonitoringModuleOptions>>
  ): DynamicModule {
    return {
      module: MonitoringModule,
      global: true,
      imports: options.imports ?? [],
      providers: [
        {
          provide: MONITORING_CONFIG,
          useFactory: async (...args: unknown[]) => mergeConfig(await options.useFactory(...args)),
          inject: options.inject ?? [],
        },
        MonitoringManager,
        { provide: MONITORING_MANAGER, useExisting: MonitoringManager },
        MonitoringProviderLoader,
      ],
      exports: [MONITORING_CONFIG, MONITORING_MANAGER, MonitoringManager],
    };
  }

  /**
   * Register a custom provider class. The class is instantiated via DI and
   * registered with the manager during `onApplicationBootstrap`.
   *
   * Accepts a single provider class or an array of them.
   *
   * @param provider - A class (or array of classes) implementing
   *   `IMonitoringProvider`.
   * @returns Dynamic module definition.
   */
  public static forFeature(
    provider: Type<IMonitoringProvider> | Type<IMonitoringProvider>[]
  ): DynamicModule {
    const classes = Array.isArray(provider) ? provider : [provider];
    return {
      module: MonitoringModule,
      providers: classes.flatMap((providerClass) => [
        providerClass,
        {
          provide: seedLoaderToken(providerClass.name),
          useFactory: (manager: IMonitoringManager, instance: IMonitoringProvider) =>
            createSeedLoader(() => manager.register(instance)),
          inject: [MONITORING_MANAGER, providerClass],
        },
      ]),
      exports: classes,
    };
  }
}
