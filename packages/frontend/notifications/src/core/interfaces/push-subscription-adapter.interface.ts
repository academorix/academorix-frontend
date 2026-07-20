/**
 * @file push-subscription-adapter.interface.ts
 * @module @stackra/notifications/core/interfaces
 * @description Platform-agnostic adapter contract for push subscription
 *   plumbing.
 *
 *   `PushSubscriptionManager` is a single, platform-independent
 *   service registered in the core module. It delegates every side
 *   effect to a platform-specific adapter bound under
 *   `PUSH_SUBSCRIPTION_ADAPTER`:
 *   - Web: {@link WebPushAdapter} wired by `PushModule.forRoot`.
 *   - Native: {@link ExpoPushTokenAdapter} wired by
 *     `NativeNotificationModule.forRoot`.
 *
 *   The two adapters expose the same shape so the manager code path
 *   is one branch — read the {@link IPushSubscriptionResult}'s `kind`
 *   discriminator to narrow the `value`.
 */

/**
 * Envelope carrying a push subscription result from an adapter.
 *
 * The `kind` discriminator lets callers narrow the opaque `value`
 * without importing the platform-specific interfaces (Web
 * `IWebPushSubscription` vs. native `INativePushToken`).
 */
export interface IPushSubscriptionResult {
  /** Discriminator — which adapter produced the value. */
  readonly kind: "web" | "native";
  /**
   * The adapter-specific subscription payload — narrowed by
   * `kind`. Consumers cast to `IWebPushSubscription` on web and
   * `INativePushToken` on native.
   */
  readonly value: unknown;
}

/**
 * Platform-agnostic contract implemented by every push subscription
 * adapter.
 *
 * Every method is fail-soft — an adapter that can't perform its work
 * (missing service worker, native peer not installed) returns `null`
 * or `false` rather than throwing so callers can branch on the
 * result without a `try/catch`.
 */
export interface IPushSubscriptionAdapter {
  /** Which platform the adapter targets. */
  readonly platform: "web" | "native";

  /**
   * Whether the current environment supports the push APIs the
   * adapter depends on.
   */
  isSupported(): boolean;

  /**
   * Read the current permission state (`'default' | 'granted' |
   * 'denied'`). Returns `'denied'` on unsupported environments so
   * callers can early-out on a single check.
   */
  getPermissionState(): Promise<NotificationPermission>;

  /**
   * Read the current subscription, if any. Returns `null` when the
   * user has never subscribed or when the environment is
   * unsupported.
   */
  getSubscription(): Promise<IPushSubscriptionResult | null>;

  /**
   * Subscribe the current user / device. Adapter-specific config
   * (VAPID public key on web, Expo project id on native) is passed
   * verbatim.
   *
   * @param config - Optional adapter-specific override.
   * @returns The wire-friendly subscription payload.
   */
  subscribe(config?: unknown): Promise<IPushSubscriptionResult>;

  /**
   * Unsubscribe the current user / device.
   *
   * @returns `true` when the subscription was cancelled; `false`
   *   when no subscription was active.
   */
  unsubscribe(): Promise<boolean>;
}
