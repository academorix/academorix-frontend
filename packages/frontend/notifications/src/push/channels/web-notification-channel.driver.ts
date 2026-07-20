/**
 * @file web-notification-channel.driver.ts
 * @module @stackra/notifications/push/channels
 * @description OS-level notification driver for the web.
 *
 *   Fires the browser's `new Notification(title, options)` when
 *   permission is granted. Idempotent + fail-soft — every branch
 *   that can throw (SSR, denied permission, no `Notification`
 *   global) is caught so a broken environment can never break
 *   dispatch through the manager.
 *
 *   Registered on the {@link NotificationManager} at
 *   `id = 'os-notification'` via a canonical `createSeedLoader`
 *   feeder wired inside `PushModule.forRoot`.
 */

import { Injectable } from "@stackra/container";

import type { INotificationChannelDriver, INotificationPayload } from "@/core/interfaces";

/**
 * OS-notification channel driver (web).
 *
 * @example
 * ```typescript
 * // Wired automatically by `PushModule.forRoot(...)`; consumers
 * // never `register()` this manually.
 * await manager.dispatch(payload, { channels: ['in-app', 'os-notification'] });
 * ```
 */
@Injectable()
export class WebNotificationChannelDriver implements INotificationChannelDriver {
  /** Channel id — `NotificationManager` routes payloads whose */
  /** channel list contains `'os-notification'` to this driver. */
  public readonly id = "os-notification";

  /**
   * Fire the OS-level notification. Fail-soft — every downstream
   * error is swallowed so a broken browser environment never
   * propagates through the manager.
   *
   * @param payload - The notification payload.
   */
  public async deliver(payload: INotificationPayload): Promise<void> {
    // SSR + jsdom-without-permission guards: bail out silently when
    // the notification API isn't available or the user hasn't
    // granted permission. The centre still records the payload for
    // in-app display.
    if (typeof globalThis === "undefined") return;
    const g = globalThis as {
      readonly Notification?: {
        readonly permission: NotificationPermission;
      } & (new (title: string, options?: NotificationOptions) => Notification);
    };
    if (typeof g.Notification === "undefined") return;
    if (g.Notification.permission !== "granted") return;

    try {
      // A minimal, spec-compliant options object — every field is
      // optional so a payload without body / icon / tag / data
      // still fires a valid notification.
      const options: NotificationOptions = {
        ...(payload.body ? { body: payload.body } : {}),
        ...(payload.icon ? { icon: payload.icon } : {}),
        ...(payload.badge ? { badge: payload.badge } : {}),
        ...(payload.tag ? { tag: payload.tag } : {}),
        ...(payload.data ? { data: payload.data } : {}),
        ...(payload.requireInteraction ? { requireInteraction: true } : {}),
        ...(payload.silent ? { silent: true } : {}),
        ...(payload.dir ? { dir: payload.dir } : {}),
        ...(payload.lang ? { lang: payload.lang } : {}),
      };
      // The `Notification` constructor is intentionally called
      // through the narrowed global — TS won't accept a plain
      // `new Notification(...)` against the union above.
      const NotificationCtor = g.Notification as unknown as new (
        title: string,
        options?: NotificationOptions,
      ) => Notification;
      // Keep the reference alive briefly so the browser can render
      // it; we don't need to react to `onclick` here — the
      // `NotificationManager` fires the corresponding in-app entry
      // through the `in-app` driver in the same dispatch.
      void new NotificationCtor(payload.title ?? "", options);
    } catch {
      // fail-soft — permission race, invalid options, etc.
    }
  }
}
