/**
 * @file native-notification-manager.service.ts
 * @module @stackra/notifications/native/services
 * @description React Native notification manager — attaches the
 *   {@link ExpoNotificationListenerAdapter} at boot so every
 *   received notification is forwarded to the in-app centre.
 *
 *   Consumers who want the manager-side dispatch surface (dispatch
 *   to the in-app centre from app code) use the core
 *   `NotificationManager` — this class only owns the RN-specific
 *   OS-listener wiring.
 */

import { Injectable } from "@stackra/container";
import type { OnApplicationBootstrap } from "@stackra/contracts";

import { ExpoNotificationListenerAdapter } from "../adapters";

/**
 * React Native notification manager.
 *
 * Runs on `onApplicationBootstrap` so the listener is attached
 * after every module has finished `onModuleInit` — matches the
 * module-lifecycle rule for cross-module wiring.
 */
@Injectable()
export class NativeNotificationManager implements OnApplicationBootstrap {
  public constructor(private readonly listener: ExpoNotificationListenerAdapter) {}

  /** Attach the listener after every module has wired. */
  public async onApplicationBootstrap(): Promise<void> {
    // `attach()` is idempotent and safe to call in every bootstrap
    // path — including RN's hot reload.
    await this.listener.attach();
  }
}
