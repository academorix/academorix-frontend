/**
 * @file pwa.module.ts
 * @module @stackra/pwa/core
 * @description PWA DI module.
 *
 *   Registers the singleton {@link PwaService} (install + update +
 *   standalone snapshot store) and the {@link AnalyticsBridgeService}
 *   (fail-soft fan-out to `@stackra/analytics`'s `IAnalyticsManager`,
 *   when present).
 *
 *   Durable offline mutation queueing is intentionally NOT part of
 *   this module — use `@stackra/sync`'s `OperationQueue` +
 *   `SyncEngine`, or `@stackra/queue`'s `IndexedDBConnector` /
 *   `LocalStorageConnector` for that concern.
 *
 *   The module is `global: true` so downstream feature modules
 *   resolve `PWA_SERVICE` without importing PwaModule themselves.
 */

import { Module, type DynamicModule } from '@stackra/container';

import { APP_UPDATE_SERVICE, PWA_CONFIG, PWA_SERVICE } from './constants';
import { mergeConfig } from './utils/merge-config.util';
import { AnalyticsBridgeService } from './services/analytics-bridge.service';
import { AppUpdateService } from './services/app-update.service';
import { PwaService } from './services/pwa.service';
import type { IPwaModuleOptions } from './interfaces';

/**
 * PWA root module.
 *
 * @example
 * ```typescript
 * @Module({
 *   imports: [
 *     AnalyticsModule.forRoot({ providers: { ga4: { measurementId: 'G-…' } } }),
 *     PwaModule.forRoot({
 *       install: { delayMs: 15_000 },
 *       update: { pollingIntervalMs: 60_000 },
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
export class PwaModule {
  /**
   * Register the PWA runtime globally.
   *
   * @param options - Optional overrides — every field falls back to
   *   `DEFAULT_PWA_CONFIG` when omitted.
   */
  public static forRoot(options: IPwaModuleOptions = {}): DynamicModule {
    const config = mergeConfig(options);

    // The app-update service is bound only when the caller opts in
    // via `appUpdate: {...}`. This keeps consumers who only want
    // install prompts / SW updates from paying for the HTTP +
    // realtime resolution work.
    const appUpdateEnabled = config.appUpdate !== undefined;

    return {
      module: PwaModule,
      global: true,
      providers: [
        { provide: PWA_CONFIG, useValue: config },
        AnalyticsBridgeService,
        PwaService,
        { provide: PWA_SERVICE, useExisting: PwaService },
        ...(appUpdateEnabled
          ? ([
              AppUpdateService,
              { provide: APP_UPDATE_SERVICE, useExisting: AppUpdateService },
            ] as const)
          : []),
      ],
      exports: [
        PWA_CONFIG,
        AnalyticsBridgeService,
        PwaService,
        PWA_SERVICE,
        ...(appUpdateEnabled ? ([AppUpdateService, APP_UPDATE_SERVICE] as const) : []),
      ],
    };
  }
}
