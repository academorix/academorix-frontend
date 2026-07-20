/**
 * @file notification.module.ts
 * @module @stackra/notifications/core
 * @description Notification DI module.
 *
 *   `forRoot(options)` — provides the merged config, the
 *   {@link NotificationManager}, the {@link InAppNotificationCentre},
 *   the {@link NotificationPreferencesService}, the shared
 *   {@link PushSubscriptionManager} (platform adapter wired by
 *   `PushModule` / `NativeNotificationModule`), and the
 *   {@link AnalyticsBridgeService}. When the caller passes a
 *   `push: { vapidPublicKey: … }` block, the module also imports
 *   `PushModule.forRoot(push)` transitively so consumers can drop
 *   both features in with a single import.
 *
 *   The default `in-app` channel driver is auto-registered against
 *   the manager via a canonical `createSeedLoader` provider — no
 *   bootstrap classes, no `useFactory` returning a sentinel.
 *
 *   `forFeature(driverClass)` — registers a custom channel driver
 *   using the same `createSeedLoader` pattern. The driver
 *   auto-registers on the manager during `onApplicationBootstrap`.
 */

import { Module, type DynamicModule, type Type } from '@stackra/container';
import { createSeedLoader, seedLoaderToken } from '@stackra/support';

import { InAppChannelDriver } from './channels';
import {
  IN_APP_NOTIFICATION_CENTRE,
  NOTIFICATION_CONFIG,
  NOTIFICATION_MANAGER,
  NOTIFICATION_PREFERENCES_SERVICE,
  PUSH_SUBSCRIPTION_MANAGER,
} from './constants';
import { mergeConfig } from './utils/merge-config.util';
import { AnalyticsBridgeService } from './services/analytics-bridge.service';
import { InAppNotificationCentre } from './services/in-app-notification-centre.service';
import { NotificationManager } from './services/notification-manager.service';
import { NotificationPreferencesService } from './services/notification-preferences.service';
import { PushSubscriptionManager } from './services/push-subscription-manager.service';
import type { INotificationChannelDriver, INotificationModuleOptions } from './interfaces';
import { PushModule } from '../push/push.module';

/**
 * Notifications root module.
 *
 * @example
 * ```typescript
 * @Module({
 *   imports: [
 *     StorageModule.forRoot({...}),
 *     AnalyticsModule.forRoot({...}),
 *     NotificationModule.forRoot({
 *       centre: { storage: 'localStorage', maxItems: 200 },
 *       push: { vapidPublicKey: import.meta.env.VITE_VAPID_KEY as string },
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
export class NotificationModule {
  /**
   * Register the notifications runtime globally.
   *
   * @param options - Optional overrides — every field falls back to
   *   `DEFAULT_NOTIFICATIONS_CONFIG` when omitted.
   */
  public static forRoot(options: INotificationModuleOptions = {}): DynamicModule {
    const config = mergeConfig(options);
    return {
      module: NotificationModule,
      global: true,
      // Transitively wire the Web Push module when the caller
      // supplied a push config — a one-import path for the common
      // "in-app + web push" combo.
      imports: config.push ? [PushModule.forRoot(config.push)] : [],
      providers: [
        { provide: NOTIFICATION_CONFIG, useValue: config },
        AnalyticsBridgeService,
        InAppNotificationCentre,
        { provide: IN_APP_NOTIFICATION_CENTRE, useExisting: InAppNotificationCentre },
        NotificationManager,
        { provide: NOTIFICATION_MANAGER, useExisting: NotificationManager },
        NotificationPreferencesService,
        {
          provide: NOTIFICATION_PREFERENCES_SERVICE,
          useExisting: NotificationPreferencesService,
        },
        // Shared push manager — the platform adapter must be bound
        // by a downstream platform module (`PushModule` on web,
        // `NativeNotificationModule` on native). Without that, the
        // container fails to construct the manager — the correct
        // behaviour, since consumers must opt into a platform.
        PushSubscriptionManager,
        { provide: PUSH_SUBSCRIPTION_MANAGER, useExisting: PushSubscriptionManager },
        // Built-in in-app channel driver + seed loader that
        // auto-registers it on the manager at
        // `onApplicationBootstrap`. Unique token per module load
        // — see `module-lifecycle.md` for the last-wins rule.
        InAppChannelDriver,
        {
          provide: seedLoaderToken('notifications:channel:in-app'),
          useFactory: (manager: NotificationManager, driver: InAppChannelDriver) =>
            createSeedLoader(() => manager.register(driver)),
          inject: [NOTIFICATION_MANAGER, InAppChannelDriver],
        },
      ],
      exports: [
        NOTIFICATION_CONFIG,
        AnalyticsBridgeService,
        InAppNotificationCentre,
        IN_APP_NOTIFICATION_CENTRE,
        NotificationManager,
        NOTIFICATION_MANAGER,
        NotificationPreferencesService,
        NOTIFICATION_PREFERENCES_SERVICE,
        PushSubscriptionManager,
        PUSH_SUBSCRIPTION_MANAGER,
      ],
    };
  }

  /**
   * Register additional channel driver classes.
   *
   * Every driver is instantiated by the container (`@Injectable()`
   * required on the class) then registered with the manager during
   * `onApplicationBootstrap` via a `createSeedLoader` provider under
   * a unique `seedLoaderToken`. Multiple `forFeature` calls compose
   * cleanly under the container's last-wins semantics because each
   * seed token is unique.
   *
   * @param driver - A class implementing
   *   {@link INotificationChannelDriver} — or an array of them.
   *
   * @example
   * ```typescript
   * @Injectable()
   * class EmailChannelDriver implements INotificationChannelDriver {
   *   public readonly id = 'email';
   *   public async deliver(payload: INotificationPayload): Promise<void> {
   *     await this.mailer.send({ ...payload });
   *   }
   * }
   *
   * @Module({
   *   imports: [NotificationModule.forFeature(EmailChannelDriver)],
   * })
   * export class EmailModule {}
   * ```
   */
  public static forFeature(
    driver: Type<INotificationChannelDriver> | Type<INotificationChannelDriver>[]
  ): DynamicModule {
    const classes = Array.isArray(driver) ? driver : [driver];
    return {
      module: NotificationModule,
      providers: classes.flatMap((driverClass) => [
        driverClass,
        {
          // Unique seed token per driver class so contributions don't
          // collide under the container's last-wins semantics.
          provide: seedLoaderToken(`notifications:${driverClass.name}`),
          useFactory: (manager: NotificationManager, instance: INotificationChannelDriver) =>
            createSeedLoader(() => manager.register(instance)),
          inject: [NOTIFICATION_MANAGER, driverClass],
        },
      ]),
      exports: classes,
    };
  }
}
