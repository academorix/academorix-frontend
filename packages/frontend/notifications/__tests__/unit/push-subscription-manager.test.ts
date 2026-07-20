/**
 * @file push-subscription-manager.test.ts
 * @module @stackra/notifications/__tests__/unit
 * @description Behavioural tests for the shared
 *   {@link PushSubscriptionManager}.
 *
 *   Verifies the manager delegates every read + write to the
 *   injected {@link IPushSubscriptionAdapter}, emits the correct
 *   analytics events, and rethrows adapter errors so callers can
 *   render an error UI.
 */

import { describe, expect, it } from "vitest";

import { PushSubscriptionManager } from "@/core/services";
import { NOTIFICATION_EVENTS } from "@/core/constants";
import type { IPushSubscriptionAdapter, IPushSubscriptionResult } from "@/core/interfaces";
import { MockPushSubscriptionAdapter } from "@/testing";

/**
 * Minimal spying analytics bridge. Captures every `emit` call.
 */
class RecordingAnalytics {
  public readonly events: Array<{ event: string; payload?: Record<string, unknown> }> = [];
  public isEnabled(): boolean {
    return true;
  }
  public emit(event: string, payload?: Record<string, unknown>): void {
    this.events.push({ event, payload });
  }
}

describe("PushSubscriptionManager — reads", () => {
  it("delegates isSupported / getPermissionState / getSubscription to the adapter", async () => {
    const adapter = new MockPushSubscriptionAdapter({
      supported: true,
      permission: "granted",
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const manager = new PushSubscriptionManager(adapter as unknown as IPushSubscriptionAdapter);
    expect(manager.isSupported()).toBe(true);
    expect(await manager.getPermissionState()).toBe("granted");
    expect(await manager.getSubscription()).toBeNull();
    expect(adapter.getPermissionStateCalls).toBe(1);
    expect(adapter.getSubscriptionCalls).toBe(1);
  });
});

describe("PushSubscriptionManager — subscribe", () => {
  it("emits WEB_PUSH_SUBSCRIBED on a web-platform adapter success", async () => {
    const adapter = new MockPushSubscriptionAdapter({ platform: "web" });
    const analytics = new RecordingAnalytics();
    const manager = new PushSubscriptionManager(
      adapter as unknown as IPushSubscriptionAdapter,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      analytics as any,
    );
    await manager.subscribe();
    const kinds = analytics.events.map((e) => e.event);
    expect(kinds).toContain(NOTIFICATION_EVENTS.WEB_PUSH_SUBSCRIBED);
  });

  it("emits NATIVE_PUSH_TOKEN_OBTAINED on a native adapter success", async () => {
    const adapter = new MockPushSubscriptionAdapter({ platform: "native" });
    const analytics = new RecordingAnalytics();
    const manager = new PushSubscriptionManager(
      adapter as unknown as IPushSubscriptionAdapter,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      analytics as any,
    );
    await manager.subscribe();
    const kinds = analytics.events.map((e) => e.event);
    expect(kinds).toContain(NOTIFICATION_EVENTS.NATIVE_PUSH_TOKEN_OBTAINED);
  });

  it("rethrows adapter errors and records the failure event", async () => {
    const adapter = new MockPushSubscriptionAdapter({ platform: "web" });
    adapter.simulateSubscribeError(new Error("vapid missing"));
    const analytics = new RecordingAnalytics();
    const manager = new PushSubscriptionManager(
      adapter as unknown as IPushSubscriptionAdapter,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      analytics as any,
    );
    await expect(manager.subscribe()).rejects.toThrow("vapid missing");
    const kinds = analytics.events.map((e) => e.event);
    expect(kinds).toContain(NOTIFICATION_EVENTS.WEB_PUSH_SUBSCRIPTION_FAILED);
  });
});

describe("PushSubscriptionManager — unsubscribe", () => {
  it("returns the adapter answer + emits WEB_PUSH_UNSUBSCRIBED on web success", async () => {
    const subscription: IPushSubscriptionResult = {
      kind: "web",
      value: {
        endpoint: "https://example.com/subs/x",
        expirationTime: null,
        keys: { p256dh: "p", auth: "a" },
      },
    };
    const adapter = new MockPushSubscriptionAdapter({ platform: "web", subscription });
    const analytics = new RecordingAnalytics();
    const manager = new PushSubscriptionManager(
      adapter as unknown as IPushSubscriptionAdapter,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      analytics as any,
    );
    const result = await manager.unsubscribe();
    expect(result).toBe(true);
    expect(analytics.events.map((e) => e.event)).toContain(
      NOTIFICATION_EVENTS.WEB_PUSH_UNSUBSCRIBED,
    );
  });

  it("returns false when the adapter reports no active subscription", async () => {
    const adapter = new MockPushSubscriptionAdapter({ platform: "web", subscription: null });
    const manager = new PushSubscriptionManager(adapter as unknown as IPushSubscriptionAdapter);
    expect(await manager.unsubscribe()).toBe(false);
  });
});
