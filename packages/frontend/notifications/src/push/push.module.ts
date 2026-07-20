/**
 * @file push.module.ts
 * @module @stackra/notifications/push
 * @description Web Push DI module — imported transitively by
 *   `NotificationModule.forRoot({ push: {...} })`, or standalone
 *   when the consumer wants push without the in-app centre.
 *
 *   The module wires:
 *   - The resolved {@link IWebPushConfig} value provider.
 *   - The {@link WebPushAdapter} bound under
 *     {@link PUSH_SUBSCRIPTION_ADAPTER} — makes the core
 *     {@link PushSubscriptionManager} usable.
 *   - The {@link WebNotificationChannelDriver} auto-registered on
 *     the manager via `createSeedLoader` — dispatches with
 *     `channels: ['os-notification']` now fire the browser's OS
 *     notification.
 */

import { Module, type DynamicModule } from "@stackra/container";
import { createSeedLoader, seedLoaderToken } from "@stackra/support";

import type { IWebPushConfigOptions } from "@/core/interfaces";
import { NOTIFICATION_MANAGER, PUSH_SUBSCRIPTION_ADAPTER } from "@/core/constants";
import type { NotificationManager } from "@/core/services";
import { WebPushAdapter } from "./adapters";
import { WebNotificationChannelDriver } from "./channels";
import { WEB_PUSH_CONFIG } from "./constants";
import type { IWebPushConfig } from "./interfaces";

/**
 * Fill in the Web Push module defaults. Kept in this file rather
 * than a dedicated `mergeConfig.util.ts` because the surface is
 * two fields (`serviceWorkerScope` + `userVisibleOnly`).
 */
function resolveConfig(options: IWebPushConfigOptions): IWebPushConfig {
  return {
    vapidPublicKey: options.vapidPublicKey,
    serviceWorkerScope: options.serviceWorkerScope ?? "/",
    userVisibleOnly: options.userVisibleOnly ?? true,
  };
}

/**
 * Web Push module.
 *
 * @example
 * ```typescript
 * @Module({
 *   imports: [
 *     PushModule.forRoot({
 *       vapidPublicKey: import.meta.env.VITE_VAPID_KEY as string,
 *     }),
 *   ],
 * })
 * export class PushConfig {}
 * ```
 */
@Module({})
export class PushModule {
  /** Register the Web Push adapter + OS-notification driver globally. */
  public static forRoot(options: IWebPushConfigOptions): DynamicModule {
    const config = resolveConfig(options);
    return {
      module: PushModule,
      global: true,
      providers: [
        { provide: WEB_PUSH_CONFIG, useValue: config },
        WebPushAdapter,
        // Bind the platform adapter under the shared token so the
        // core `PushSubscriptionManager` (registered in
        // `NotificationModule.forRoot`) can inject it.
        { provide: PUSH_SUBSCRIPTION_ADAPTER, useExisting: WebPushAdapter },
        // OS-notification channel driver + its seed loader —
        // auto-registers on the manager during
        // `onApplicationBootstrap`. The token is unique per module
        // load (last-wins semantics — see module-lifecycle steering).
        WebNotificationChannelDriver,
        {
          provide: seedLoaderToken("notifications:channel:os-notification:web"),
          useFactory: (manager: NotificationManager, driver: WebNotificationChannelDriver) =>
            createSeedLoader(() => manager.register(driver)),
          inject: [NOTIFICATION_MANAGER, WebNotificationChannelDriver],
        },
      ],
      exports: [
        WEB_PUSH_CONFIG,
        WebPushAdapter,
        PUSH_SUBSCRIPTION_ADAPTER,
        WebNotificationChannelDriver,
      ],
    };
  }
}
