/**
 * @file native-notification.module.ts
 * @module @stackra/notifications/native
 * @description React Native composition of `NotificationModule.forRoot`.
 *
 *   Imports the platform-agnostic core module and layers on:
 *   - The {@link ExpoPushTokenAdapter} bound under
 *     {@link PUSH_SUBSCRIPTION_ADAPTER} — makes the shared
 *     {@link PushSubscriptionManager} usable on native.
 *   - The {@link ExpoNotificationListenerAdapter} that forwards
 *     received-notifications to the in-app centre.
 *   - The {@link ExpoNotificationChannelDriver} auto-registered on
 *     the {@link NotificationManager} for OS-tray dispatch.
 */

import { Module, type DynamicModule } from "@stackra/container";
import { createSeedLoader, seedLoaderToken } from "@stackra/support";

import { NOTIFICATION_MANAGER, PUSH_SUBSCRIPTION_ADAPTER } from "@/core/constants";
import type { NotificationManager } from "@/core/services";
import { NotificationModule } from "@/core/notification.module";
import { ExpoNotificationListenerAdapter, ExpoPushTokenAdapter } from "./adapters";
import { ExpoNotificationChannelDriver } from "./channels";
import {
  EXPO_NOTIFICATION_LISTENER_ADAPTER,
  EXPO_PUSH_CONFIG,
  EXPO_PUSH_TOKEN_ADAPTER,
  NATIVE_NOTIFICATION_MANAGER,
} from "./constants";
import type { IExpoPushConfig, INativeNotificationModuleOptions } from "./interfaces";
import { NativeNotificationManager } from "./services";

/**
 * Extract the Expo config subset out of the native module options,
 * dropping the `defaultStack` sugar that only feeds the outer's
 * `defaultStack`.
 */
function toExpoConfig(options: INativeNotificationModuleOptions): IExpoPushConfig {
  const push = options.push ?? {};
  return {
    ...(push.projectId ? { projectId: push.projectId } : {}),
    ...(push.experienceId ? { experienceId: push.experienceId } : {}),
    ...(push.applicationId ? { applicationId: push.applicationId } : {}),
  };
}

/**
 * Native notification module.
 *
 * @example
 * ```typescript
 * @Module({
 *   imports: [
 *     NativeStorageModule.forRoot({
 *       default: 'asyncStorage',
 *       stores: { asyncStorage: { driver: 'asyncStorage' } },
 *     }),
 *     NativeNotificationModule.forRoot({
 *       centre: { storage: 'asyncStorage', maxItems: 200 },
 *       push: { projectId: '00000000-0000-0000-0000-000000000000' },
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
export class NativeNotificationModule {
  /**
   * Compose `NotificationModule.forRoot(options)` with the RN
   * adapters + Expo channel driver.
   */
  public static forRoot(options: INativeNotificationModuleOptions = {}): DynamicModule {
    const expoConfig = toExpoConfig(options);
    // Forward the shared subset of the options (no `push` block —
    // core `NotificationModule` only accepts a web-shaped push
    // config; Expo lives on the native module's own subpath).
    const coreOptions = {
      ...(options.centre ? { centre: options.centre } : {}),
      ...(options.defaultStack ? { defaultStack: options.defaultStack } : {}),
    };
    return {
      module: NativeNotificationModule,
      global: true,
      imports: [NotificationModule.forRoot(coreOptions)],
      providers: [
        // Expo config value provider — always registered so the
        // adapter can inject it as `@Optional()`.
        { provide: EXPO_PUSH_CONFIG, useValue: expoConfig },
        // Platform adapter — bound both under the native-specific
        // token AND the shared `PUSH_SUBSCRIPTION_ADAPTER` so the
        // core `PushSubscriptionManager` picks up the same class.
        ExpoPushTokenAdapter,
        { provide: EXPO_PUSH_TOKEN_ADAPTER, useExisting: ExpoPushTokenAdapter },
        { provide: PUSH_SUBSCRIPTION_ADAPTER, useExisting: ExpoPushTokenAdapter },
        // Received-notification listener.
        ExpoNotificationListenerAdapter,
        {
          provide: EXPO_NOTIFICATION_LISTENER_ADAPTER,
          useExisting: ExpoNotificationListenerAdapter,
        },
        // RN-specific manager — attaches the listener at
        // `onApplicationBootstrap`.
        NativeNotificationManager,
        {
          provide: NATIVE_NOTIFICATION_MANAGER,
          useExisting: NativeNotificationManager,
        },
        // OS-notification channel driver + its seed loader.
        ExpoNotificationChannelDriver,
        {
          provide: seedLoaderToken("notifications:channel:os-notification:native"),
          useFactory: (manager: NotificationManager, driver: ExpoNotificationChannelDriver) =>
            createSeedLoader(() => manager.register(driver)),
          inject: [NOTIFICATION_MANAGER, ExpoNotificationChannelDriver],
        },
      ],
      exports: [
        EXPO_PUSH_CONFIG,
        EXPO_PUSH_TOKEN_ADAPTER,
        EXPO_NOTIFICATION_LISTENER_ADAPTER,
        NATIVE_NOTIFICATION_MANAGER,
        PUSH_SUBSCRIPTION_ADAPTER,
        ExpoPushTokenAdapter,
        ExpoNotificationListenerAdapter,
        NativeNotificationManager,
        ExpoNotificationChannelDriver,
      ],
    };
  }
}
