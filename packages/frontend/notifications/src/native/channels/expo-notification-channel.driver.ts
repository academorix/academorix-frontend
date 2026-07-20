/**
 * @file expo-notification-channel.driver.ts
 * @module @stackra/notifications/native/channels
 * @description OS-level notification driver for React Native (Expo).
 *
 *   Fires `Notifications.scheduleNotificationAsync({ trigger: null })`
 *   so the payload surfaces immediately in the device's OS tray.
 *   `expo-notifications` is an optional peer — loaded lazily via
 *   `await import(/* @vite-ignore *\/ moduleName)` and fail-soft
 *   when the peer isn't installed.
 */

import { Injectable } from "@stackra/container";

import type { INotificationChannelDriver, INotificationPayload } from "@/core/interfaces";

/**
 * Minimal shape of the `expo-notifications` module the driver reads.
 *
 * Kept narrow so tests can stub only the surface actually used —
 * `scheduleNotificationAsync` with a null trigger.
 */
interface IExpoScheduleModule {
  scheduleNotificationAsync(input: {
    content: {
      title?: string;
      body?: string;
      data?: unknown;
    };
    trigger: null;
  }): Promise<string>;
}

/**
 * Default lazy loader for the optional peer.
 */
async function loadExpoNotifications(): Promise<IExpoScheduleModule | null> {
  try {
    const moduleName = "expo-notifications";
    const mod = (await import(/* @vite-ignore */ moduleName)) as
      { default?: IExpoScheduleModule } | IExpoScheduleModule;
    return "default" in mod && mod.default ? mod.default : (mod as IExpoScheduleModule);
  } catch {
    return null;
  }
}

/**
 * OS-notification channel driver (native / Expo).
 */
@Injectable()
export class ExpoNotificationChannelDriver implements INotificationChannelDriver {
  /** Channel id — mirrors the web driver so cross-platform dispatch is */
  /** channel-agnostic (`channels: ['in-app', 'os-notification']`). */
  public readonly id = "os-notification";

  /**
   * Test hook — override the module loader with a mock.
   */
  public loader: (() => Promise<IExpoScheduleModule | null>) | null = null;

  /**
   * Schedule the OS-level notification. Fail-soft — every downstream
   * error is swallowed so a broken environment never propagates
   * through the manager.
   */
  public async deliver(payload: INotificationPayload): Promise<void> {
    const load = this.loader ?? loadExpoNotifications;
    const notifications = await load();
    if (!notifications) return;
    try {
      await notifications.scheduleNotificationAsync({
        content: {
          title: payload.title,
          ...(payload.body ? { body: payload.body } : {}),
          ...(payload.data ? { data: payload.data } : {}),
        },
        // A null trigger fires the notification immediately (Expo's
        // API — the trigger field is required, `null` = "now").
        trigger: null,
      });
    } catch {
      // fail-soft — the peer may be unavailable at runtime even
      // though the module resolved (rare Metro race).
    }
  }
}
