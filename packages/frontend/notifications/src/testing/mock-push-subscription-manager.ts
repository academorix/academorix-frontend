/**
 * @file mock-push-subscription-manager.ts
 * @module @stackra/notifications/testing
 * @description In-memory `PushSubscriptionManager`-shaped mock.
 *
 *   Mirrors the platform-agnostic {@link PushSubscriptionManager}
 *   public API so tests bind this under `PUSH_SUBSCRIPTION_MANAGER`
 *   in a test DI container. Prefer
 *   {@link MockPushSubscriptionAdapter} — this mock is kept for
 *   consumers that want to bypass the adapter layer entirely.
 */

import type { IPushSubscriptionResult } from '@/core/interfaces';

/**
 * In-memory `PushSubscriptionManager` mock.
 */
export class MockPushSubscriptionManager {
  /** Current cached subscription. */
  private subscription: IPushSubscriptionResult | null = null;

  /** Number of subscribe / unsubscribe / getSubscription calls. */
  public subscribeCalls = 0;
  public unsubscribeCalls = 0;
  public getSubscriptionCalls = 0;

  /** Test hook — override the `subscribe()` outcome. */
  public subscribeResult: IPushSubscriptionResult | null = null;
  /** Test hook — throw from `subscribe()`. */
  public subscribeError: Error | null = null;

  /** Test hook — override `isSupported()`. */
  public supported = true;
  /** Test hook — override `getPermissionState()`. */
  public permission: NotificationPermission = 'default';

  /**
   * @param initial - Seed the manager with a canned subscription.
   */
  public constructor(initial?: { readonly subscription?: IPushSubscriptionResult | null }) {
    if (initial?.subscription !== undefined) this.subscription = initial.subscription;
    this.subscribeResult = initial?.subscription ?? null;
  }

  // ── Public API ───────────────────────────────────────────────────

  public isSupported(): boolean {
    return this.supported;
  }

  public async getPermissionState(): Promise<NotificationPermission> {
    return this.permission;
  }

  public async getSubscription(): Promise<IPushSubscriptionResult | null> {
    this.getSubscriptionCalls += 1;
    return this.subscription;
  }

  public async subscribe(): Promise<IPushSubscriptionResult> {
    this.subscribeCalls += 1;
    if (this.subscribeError) throw this.subscribeError;
    const fallback: IPushSubscriptionResult = {
      kind: 'web',
      value: {
        endpoint: 'https://push.example.com/subs/mock',
        expirationTime: null,
        keys: { p256dh: 'p256dh-mock', auth: 'auth-mock' },
      },
    };
    const result = this.subscribeResult ?? fallback;
    this.subscription = result;
    return result;
  }

  public async unsubscribe(): Promise<boolean> {
    this.unsubscribeCalls += 1;
    const had = this.subscription != null;
    this.subscription = null;
    return had;
  }

  // ── Test hooks ───────────────────────────────────────────────────

  /** Force the cached subscription. */
  public simulateSubscription(subscription: IPushSubscriptionResult | null): void {
    this.subscription = subscription;
    this.subscribeResult = subscription;
  }

  /** Force `subscribe()` to throw the given error. */
  public simulateSubscribeError(error: Error | null): void {
    this.subscribeError = error;
  }

  /** Reset every counter + clear the seeded subscription. */
  public reset(): void {
    this.subscribeCalls = 0;
    this.unsubscribeCalls = 0;
    this.getSubscriptionCalls = 0;
    this.subscription = null;
    this.subscribeResult = null;
    this.subscribeError = null;
  }
}
