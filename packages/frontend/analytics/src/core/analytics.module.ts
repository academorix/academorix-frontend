/**
 * @file analytics.module.ts
 * @module @stackra/analytics/core
 * @description DI module for the analytics system.
 *
 *   - `forRoot(options)` — binds config, the `AnalyticsManager`, and the
 *     discovery loader. Built-in providers (console, GA4, pixels) are
 *     seeded by the manager's `onModuleInit` from config.
 *   - `forFeature(providerClass)` — registers a custom provider class via a
 *     lifecycle seed loader (no factory side effects), so marketing/other
 *     providers can be added per feature module.
 */

import { Module, type DynamicModule } from "@stackra/container";
import type { IAsyncModuleOptions } from "@stackra/contracts";
import { ANALYTICS_CONFIG, ANALYTICS_MANAGER } from "@stackra/contracts";
import type { IAnalyticsManager, IAnalyticsProvider, Type } from "@stackra/contracts";

import type { IAnalyticsModuleOptions } from "./interfaces";
import { createSeedLoader, seedLoaderToken } from "@stackra/support";

import { mergeConfig } from "./utils/merge-config.util";
import { AnalyticsManager } from "./services/analytics-manager.service";
import { AnalyticsProviderLoader } from "./services/analytics-provider-loader.service";

/**
 * Analytics DI module.
 *
 * @example
 * ```typescript
 * @Module({
 *   imports: [
 *     AnalyticsModule.forRoot({
 *       ga4: { measurementId: 'G-XXXXXXX' },
 *       metaPixel: { pixelId: '123' },
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
export class AnalyticsModule {
  /**
   * Register the analytics module globally.
   *
   * @param options - Analytics configuration.
   * @returns Dynamic module definition.
   */
  public static forRoot(options?: Partial<IAnalyticsModuleOptions>): DynamicModule {
    return {
      module: AnalyticsModule,
      global: true,
      providers: [
        { provide: ANALYTICS_CONFIG, useValue: mergeConfig(options) },
        AnalyticsManager,
        { provide: ANALYTICS_MANAGER, useExisting: AnalyticsManager },
        AnalyticsProviderLoader,
      ],
      exports: [ANALYTICS_CONFIG, ANALYTICS_MANAGER, AnalyticsManager],
    };
  }

  /**
   * Register the analytics module with async configuration.
   *
   * @param options - Async factory options.
   * @returns Dynamic module definition.
   */
  public static forRootAsync(
    options: IAsyncModuleOptions<Partial<IAnalyticsModuleOptions>>,
  ): DynamicModule {
    return {
      module: AnalyticsModule,
      global: true,
      imports: options.imports ?? [],
      providers: [
        {
          provide: ANALYTICS_CONFIG,
          useFactory: async (...args: unknown[]) => mergeConfig(await options.useFactory(...args)),
          inject: options.inject ?? [],
        },
        AnalyticsManager,
        { provide: ANALYTICS_MANAGER, useExisting: AnalyticsManager },
        AnalyticsProviderLoader,
      ],
      exports: [ANALYTICS_CONFIG, ANALYTICS_MANAGER, AnalyticsManager],
    };
  }

  /**
   * Register a custom provider class (e.g. an extra marketing pixel). The
   * class is instantiated via DI and registered with the manager during
   * `onApplicationBootstrap`.
   *
   * Accepts a single provider class or an array of them.
   *
   * @param provider - A class (or array of classes) implementing
   *   `IAnalyticsProvider`.
   * @returns Dynamic module definition.
   */
  public static forFeature(
    provider: Type<IAnalyticsProvider> | Type<IAnalyticsProvider>[],
  ): DynamicModule {
    const classes = Array.isArray(provider) ? provider : [provider];
    return {
      module: AnalyticsModule,
      providers: classes.flatMap((providerClass) => [
        providerClass,
        {
          provide: seedLoaderToken(providerClass.name),
          useFactory: (manager: IAnalyticsManager, instance: IAnalyticsProvider) =>
            createSeedLoader(() => manager.register(instance)),
          inject: [ANALYTICS_MANAGER, providerClass],
        },
      ]),
      exports: classes,
    };
  }
}
