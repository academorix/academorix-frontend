/**
 * @file mock-service-worker-registration.ts
 * @module @stackra/notifications/testing
 * @description Minimal `ServiceWorkerRegistration` stand-in for tests
 *   that exercise `PushSubscriptionManager` without touching a real
 *   service worker.
 *
 *   Covers just the surface the manager reads:
 *   `pushManager.getSubscription()` + `pushManager.subscribe(...)`.
 *   Consumers seed the mock with a canned subscription via
 *   `simulateExistingSubscription(...)`.
 */

import type { MockPushSubscription } from './mock-push-subscription';

/**
 * Test double implementing the subset of
 * `ServiceWorkerRegistration.pushManager` used by
 * `PushSubscriptionManager`.
 */
export class MockServiceWorkerRegistration {
  /** Simulated existing subscription. */
  private subscription: MockPushSubscription | null = null;

  /** Recorded `subscribe(...)` options. */
  public readonly subscribeCalls: Array<{
    readonly options: PushSubscriptionOptionsInit;
  }> = [];

  /**
   * Optional error the mock throws from `subscribe(...)` — used to
   * exercise the manager's fail-soft branches.
   */
  public subscribeError: Error | null = null;

  /** Simulate an already-active subscription. */
  public simulateExistingSubscription(subscription: MockPushSubscription | null): void {
    this.subscription = subscription;
  }

  /** Minimal `pushManager` surface — deliberately narrow. */
  public readonly pushManager = {
    getSubscription: async (): Promise<MockPushSubscription | null> => this.subscription,
    subscribe: async (options: PushSubscriptionOptionsInit): Promise<MockPushSubscription> => {
      this.subscribeCalls.push({ options });
      if (this.subscribeError) throw this.subscribeError;
      // Return the pre-seeded subscription when one exists;
      // otherwise fail loud so the test author notices the omission.
      if (this.subscription) return this.subscription;
      throw new Error(
        'MockServiceWorkerRegistration.pushManager.subscribe called without a seeded subscription.'
      );
    },
  };
}
