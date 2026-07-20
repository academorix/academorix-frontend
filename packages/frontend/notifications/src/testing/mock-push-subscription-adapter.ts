/**
 * @file mock-push-subscription-adapter.ts
 * @module @stackra/notifications/testing
 * @description In-memory {@link IPushSubscriptionAdapter} mock.
 *
 *   Tests bind this under `PUSH_SUBSCRIPTION_ADAPTER` in a test DI
 *   container as a drop-in for `WebPushAdapter` /
 *   `ExpoPushTokenAdapter`. Every method is controllable through
 *   `simulate*` hooks + assertable through call counters.
 */

import type { IPushSubscriptionAdapter, IPushSubscriptionResult } from '@/core/interfaces';

/**
 * Options accepted by {@link MockPushSubscriptionAdapter}.
 */
export interface IMockPushSubscriptionAdapterOptions {
  /** Which platform the mock advertises. Defaults to `'web'`. */
  readonly platform?: 'web' | 'native';
  /** Seed permission state. */
  readonly permission?: NotificationPermission;
  /** Seed the initial subscription (or `null`). */
  readonly subscription?: IPushSubscriptionResult | null;
  /** Seed the `isSupported()` return value. */
  readonly supported?: boolean;
}

/**
 * In-memory push subscription adapter mock.
 */
export class MockPushSubscriptionAdapter implements IPushSubscriptionAdapter {
  /** Platform discriminator (`'web'` by default). */
  public readonly platform: 'web' | 'native';

  /** Test hook — override `isSupported()`. */
  public supported: boolean;

  /** Test hook — override `getPermissionState()`. */
  public permission: NotificationPermission;

  /** Cached subscription. */
  public subscription: IPushSubscriptionResult | null;

  /** Test hook — throw from `subscribe()`. */
  public subscribeError: Error | null = null;

  /** Call counters. */
  public subscribeCalls = 0;
  public unsubscribeCalls = 0;
  public getSubscriptionCalls = 0;
  public getPermissionStateCalls = 0;

  public constructor(options: IMockPushSubscriptionAdapterOptions = {}) {
    this.platform = options.platform ?? 'web';
    this.supported = options.supported ?? true;
    this.permission = options.permission ?? 'default';
    this.subscription = options.subscription ?? null;
  }

  // ── IPushSubscriptionAdapter ────────────────────────────────────

  public isSupported(): boolean {
    return this.supported;
  }

  public async getPermissionState(): Promise<NotificationPermission> {
    this.getPermissionStateCalls += 1;
    return this.permission;
  }

  public async getSubscription(): Promise<IPushSubscriptionResult | null> {
    this.getSubscriptionCalls += 1;
    return this.subscription;
  }

  public async subscribe(_config?: unknown): Promise<IPushSubscriptionResult> {
    this.subscribeCalls += 1;
    if (this.subscribeError) throw this.subscribeError;
    const value: IPushSubscriptionResult =
      this.subscription ??
      ({
        kind: this.platform,
        value:
          this.platform === 'web'
            ? {
                endpoint: 'https://push.example.com/subs/mock',
                expirationTime: null,
                keys: { p256dh: 'p256dh-mock', auth: 'auth-mock' },
              }
            : { platform: 'ios', token: 'ExponentPushToken[mock]' },
      } as IPushSubscriptionResult);
    this.subscription = value;
    return value;
  }

  public async unsubscribe(): Promise<boolean> {
    this.unsubscribeCalls += 1;
    const had = this.subscription != null;
    this.subscription = null;
    return had;
  }

  // ── Test hooks ──────────────────────────────────────────────────

  /** Force the cached subscription. */
  public simulateSubscription(subscription: IPushSubscriptionResult | null): void {
    this.subscription = subscription;
  }

  /** Force the next `subscribe()` call to throw. */
  public simulateSubscribeError(error: Error | null): void {
    this.subscribeError = error;
  }

  /** Force the reported permission state. */
  public simulatePermission(permission: NotificationPermission): void {
    this.permission = permission;
  }

  /** Reset every counter. */
  public reset(): void {
    this.subscribeCalls = 0;
    this.unsubscribeCalls = 0;
    this.getSubscriptionCalls = 0;
    this.getPermissionStateCalls = 0;
    this.subscription = null;
    this.subscribeError = null;
  }
}
