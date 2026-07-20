/**
 * @file push-subscription-manager.service.ts
 * @module @stackra/notifications/core/services
 * @description Platform-agnostic push subscription manager.
 *
 *   Owns the entire subscription lifecycle — `isSupported`,
 *   `getPermissionState`, `getSubscription`, `subscribe`, `unsubscribe`
 *   — and delegates every side effect to the platform-specific
 *   {@link IPushSubscriptionAdapter} bound under
 *   {@link PUSH_SUBSCRIPTION_ADAPTER}.
 *
 *   The manager itself never touches DOM globals or native peers.
 *   Consumers must import ONE platform module first:
 *   - Web: `PushModule.forRoot({ vapidPublicKey })` binds
 *     {@link WebPushAdapter}.
 *   - Native: `NativeNotificationModule.forRoot({...})` binds
 *     {@link ExpoPushTokenAdapter}.
 *
 *   Without a platform module the manager fails to instantiate —
 *   that is the correct behaviour; consumers must opt into a
 *   platform.
 */

import { Inject, Injectable, Optional } from "@stackra/container";

import { NOTIFICATION_EVENTS, PUSH_SUBSCRIPTION_ADAPTER } from "../constants";
import type { IPushSubscriptionAdapter, IPushSubscriptionResult } from "../interfaces";
import { AnalyticsBridgeService } from "./analytics-bridge.service";

/**
 * Shared push subscription manager.
 *
 * @example
 * ```typescript
 * const push = app.get(PUSH_SUBSCRIPTION_MANAGER);
 * if (push.isSupported()) {
 *   const state = await push.getPermissionState();
 *   if (state !== 'denied') {
 *     const sub = await push.subscribe();
 *     await api.post('/push/subscribe', sub);
 *   }
 * }
 * ```
 */
@Injectable()
export class PushSubscriptionManager {
  public constructor(
    // The adapter is a HARD peer — resolution fails if no platform
    // module has bound one. That's intentional: consumers who want
    // push must import `PushModule` (web) or
    // `NativeNotificationModule` (native).
    @Inject(PUSH_SUBSCRIPTION_ADAPTER)
    private readonly adapter: IPushSubscriptionAdapter,
    @Optional() private readonly analytics?: AnalyticsBridgeService,
  ) {}

  // ── Reads ────────────────────────────────────────────────────────

  /** Whether the platform's push APIs are available. */
  public isSupported(): boolean {
    return this.adapter.isSupported();
  }

  /**
   * Current permission state. Returns `'denied'` on unsupported
   * environments so callers can early-out on a single check.
   */
  public getPermissionState(): Promise<NotificationPermission> {
    return this.adapter.getPermissionState();
  }

  /** Read the current subscription, if any. */
  public getSubscription(): Promise<IPushSubscriptionResult | null> {
    return this.adapter.getSubscription();
  }

  // ── Mutations ────────────────────────────────────────────────────

  /**
   * Subscribe the current user / device.
   *
   * On success emits `WEB_PUSH_SUBSCRIBED` (web) or
   * `NATIVE_PUSH_TOKEN_OBTAINED` (native); on failure emits the
   * matching `_FAILED` counterpart and rethrows so callers who need
   * to render an error UI can catch.
   *
   * @param config - Optional adapter-specific override.
   */
  public async subscribe(config?: unknown): Promise<IPushSubscriptionResult> {
    try {
      const sub = await this.adapter.subscribe(config);
      // Pick the event name off the adapter's `platform` field so
      // adding a third platform later doesn't need a manager code
      // change — the manager stays platform-agnostic.
      const eventName =
        this.adapter.platform === "web"
          ? NOTIFICATION_EVENTS.WEB_PUSH_SUBSCRIBED
          : NOTIFICATION_EVENTS.NATIVE_PUSH_TOKEN_OBTAINED;
      this.analytics?.emit(eventName, { platform: this.adapter.platform });
      return sub;
    } catch (raw) {
      const err = raw instanceof Error ? raw : new Error(String(raw));
      const failedEvent =
        this.adapter.platform === "web"
          ? NOTIFICATION_EVENTS.WEB_PUSH_SUBSCRIPTION_FAILED
          : NOTIFICATION_EVENTS.NATIVE_PUSH_TOKEN_FAILED;
      this.analytics?.emit(failedEvent, {
        platform: this.adapter.platform,
        reason: err.message,
      });
      // Rethrow so callers who need to render an error UI can
      // still catch — the manager's promise never silently
      // swallows the caller's `subscribe()` failure.
      throw err;
    }
  }

  /**
   * Unsubscribe the current user / device.
   *
   * @returns `true` when the subscription was cancelled; `false`
   *   when no subscription was active.
   */
  public async unsubscribe(): Promise<boolean> {
    const ok = await this.adapter.unsubscribe();
    if (ok && this.adapter.platform === "web") {
      this.analytics?.emit(NOTIFICATION_EVENTS.WEB_PUSH_UNSUBSCRIBED);
    }
    return ok;
  }
}
