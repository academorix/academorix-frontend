/**
 * @file notification-manager.service.ts
 * @module @stackra/notifications/core/services
 * @description The multi-channel notification orchestrator.
 *
 *   Owns:
 *   - A registry of channel drivers keyed by `id`. The built-in
 *     `'in-app'` driver forwards to {@link InAppNotificationCentre}
 *     and is auto-registered by `NotificationModule.forRoot`; the
 *     `'os-notification'` driver is auto-registered by whichever
 *     platform module is loaded (`PushModule` on web,
 *     `NativeNotificationModule` on native).
 *   - The permission state (SSR-safe, guarded on
 *     `typeof globalThis.Notification !== 'undefined'`).
 *   - A referentially stable snapshot so the React binding reads
 *     tearing-free through `useSyncExternalStore`.
 *
 *   Every state change emits through the optional
 *   {@link AnalyticsBridgeService} — a broken analytics manager never
 *   propagates the error.
 */

import { Inject, Injectable, Optional } from "@stackra/container";

import { NOTIFICATION_CONFIG, NOTIFICATION_EVENTS } from "../constants";
import { detectNotificationSupport, normalizeNotificationPayload } from "../utils";
import type {
  IDeliveryReport,
  INotificationChannelDriver,
  INotificationManager,
  INotificationManagerSnapshot,
  INotificationModuleOptions,
  INotificationPayload,
  INotificationPermissionState,
  NotificationManagerListener,
} from "../interfaces";
import { AnalyticsBridgeService } from "./analytics-bridge.service";

/**
 * The notification manager.
 *
 * @example
 * ```typescript
 * const manager = app.get(NOTIFICATION_MANAGER);
 * const report = await manager.dispatch({
 *   title: 'New comment',
 *   body: 'Hi!',
 *   data: { url: '/threads/42' },
 * });
 * // report[0] → { channelId: 'in-app', deliveredAt: 1710_…, error: null }
 * ```
 */
@Injectable()
export class NotificationManager implements INotificationManager {
  /** Registered channel drivers keyed by id. */
  private readonly drivers = new Map<string, INotificationChannelDriver>();

  /** Registered snapshot listeners. */
  private readonly listeners = new Set<NotificationManagerListener>();

  /** Cached snapshot swapped on every state change. */
  private snapshot: INotificationManagerSnapshot;

  /** Cached permission state — re-read on every `getPermissionState`. */
  private permission: INotificationPermissionState;

  public constructor(
    @Inject(NOTIFICATION_CONFIG) private readonly config: INotificationModuleOptions,
    @Optional() private readonly analytics?: AnalyticsBridgeService,
  ) {
    // The `in-app` driver is registered by `NotificationModule.forRoot`
    // via a `createSeedLoader` provider — the manager itself no longer
    // instantiates any driver, keeping this class free of concrete
    // service references.
    this.permission = this.readPermission();
    this.snapshot = this.buildSnapshot();
  }

  // ── Registration ─────────────────────────────────────────────────

  /**
   * Register a channel driver (or replace an existing one).
   *
   * @param driver - The driver to register.
   */
  public register(driver: INotificationChannelDriver): void {
    this.drivers.set(driver.id, driver);
    this.emit();
    this.analytics?.emit(NOTIFICATION_EVENTS.CHANNEL_DRIVER_REGISTERED, {
      channelId: driver.id,
    });
  }

  // ── Dispatch ─────────────────────────────────────────────────────

  /**
   * Deliver a notification through every requested channel.
   *
   * @param payload - The notification.
   * @param options - Optional dispatch settings.
   * @returns A per-channel delivery report.
   */
  public async dispatch(
    payload: INotificationPayload,
    options?: { readonly channels?: readonly string[] },
  ): Promise<readonly IDeliveryReport[]> {
    // The manager normalises once — every downstream driver receives
    // the same shape (trimmed title/body, defaulted timestamp).
    const normalised = normalizeNotificationPayload(payload);

    // Channel resolution:
    // 1) Explicit `options.channels` always wins.
    // 2) Config's `defaultStack` is used when it's set to a
    //    non-empty array — consumers who want a fixed list.
    // 3) Otherwise every currently-registered channel is used, so
    //    a platform module (web / native) that adds
    //    `'os-notification'` is picked up automatically without a
    //    config change on the caller's side.
    let channelIds: readonly string[];
    if (options?.channels) {
      channelIds = options.channels;
    } else if (this.config.defaultStack && this.config.defaultStack.length > 0) {
      channelIds = this.config.defaultStack;
    } else {
      const keys = [...this.drivers.keys()];
      channelIds = keys.length > 0 ? keys : ["in-app"];
    }

    // Sequential delivery so one driver's slow response doesn't
    // create head-of-line blocking across many channels. A future
    // revision may parallelise, but sequential keeps per-channel
    // ordering deterministic in tests.
    const reports: IDeliveryReport[] = [];
    for (const id of channelIds) {
      const driver = this.drivers.get(id);
      if (!driver) {
        reports.push({
          channelId: id,
          deliveredAt: Date.now(),
          error: new Error(`No driver registered for channel "${id}".`),
        });
        continue;
      }
      try {
        // Awaiting a `void | Promise<void>` return works uniformly.
        await driver.deliver(normalised);
        reports.push({ channelId: id, deliveredAt: Date.now(), error: null });
        this.analytics?.emit(NOTIFICATION_EVENTS.DELIVERY_SUCCEEDED, { channelId: id });
      } catch (raw) {
        // fail-soft — one driver's failure never impacts the others.
        const err = raw instanceof Error ? raw : new Error(String(raw));
        reports.push({ channelId: id, deliveredAt: Date.now(), error: err });
        this.analytics?.emit(NOTIFICATION_EVENTS.DELIVERY_FAILED, {
          channelId: id,
          error: err.message,
        });
      }
    }
    return reports;
  }

  // ── Permission ───────────────────────────────────────────────────

  /**
   * Ask the browser for notification permission.
   *
   * Silently resolves to `'denied'` on unsupported environments so
   * consumers can branch on the returned state without an extra
   * `isSupported` check.
   */
  public async requestPermission(): Promise<NotificationPermission> {
    this.analytics?.emit(NOTIFICATION_EVENTS.NOTIFICATION_PERMISSION_REQUESTED);
    if (!detectNotificationSupport()) {
      const denied: NotificationPermission = "denied";
      this.permission = { supported: false, permission: denied };
      this.emit();
      this.analytics?.emit(NOTIFICATION_EVENTS.NOTIFICATION_PERMISSION_DENIED);
      return denied;
    }
    let result: NotificationPermission = "denied";
    try {
      // The narrowed global — TS doesn't know we already probed it.
      const g = globalThis as unknown as {
        readonly Notification: typeof Notification;
      };
      result = await g.Notification.requestPermission();
    } catch {
      // fail-soft — a browser that throws (private mode) is treated
      // as a denial rather than propagating the error to the caller.
      result = "denied";
    }
    this.permission = { supported: true, permission: result };
    this.emit();
    switch (result) {
      case "granted":
        this.analytics?.emit(NOTIFICATION_EVENTS.NOTIFICATION_PERMISSION_GRANTED);
        break;
      case "denied":
        this.analytics?.emit(NOTIFICATION_EVENTS.NOTIFICATION_PERMISSION_DENIED);
        break;
      default:
        this.analytics?.emit(NOTIFICATION_EVENTS.NOTIFICATION_PERMISSION_DEFAULT);
        break;
    }
    return result;
  }

  /** Fresh read of the browser's permission state. */
  public getPermissionState(): INotificationPermissionState {
    // Re-probe on every call — consumers can drive changes through
    // the browser UI (Chrome's site settings) with no way for us to
    // observe the transition.
    this.permission = this.readPermission();
    return this.permission;
  }

  // ── Snapshot ─────────────────────────────────────────────────────

  public getSnapshot(): INotificationManagerSnapshot {
    return this.snapshot;
  }

  // ── Subscription ─────────────────────────────────────────────────

  public subscribe(listener: NotificationManagerListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  // ── Private ──────────────────────────────────────────────────────

  /** Probe the current permission state SSR-safely. */
  private readPermission(): INotificationPermissionState {
    const supported = detectNotificationSupport();
    if (!supported) return { supported: false, permission: "denied" };
    // Narrowed global — TS doesn't remember the earlier probe.
    const g = globalThis as unknown as {
      readonly Notification: { readonly permission: NotificationPermission };
    };
    return { supported: true, permission: g.Notification.permission };
  }

  /** Rebuild the cached snapshot from current state. */
  private buildSnapshot(): INotificationManagerSnapshot {
    return {
      isSupported: this.permission.supported,
      permission: this.permission,
      channels: [...this.drivers.keys()],
    };
  }

  /** Swap the cached snapshot and fan out to subscribers. */
  private emit(): void {
    this.snapshot = this.buildSnapshot();
    for (const listener of this.listeners) {
      try {
        listener();
      } catch {
        // fail-soft — a broken subscriber must not affect the others.
      }
    }
  }
}
