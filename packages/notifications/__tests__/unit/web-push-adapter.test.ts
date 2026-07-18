/**
 * @file web-push-adapter.test.ts
 * @module @stackra/notifications/__tests__/unit
 * @description Behavioural tests for the {@link WebPushAdapter}.
 *
 *   Runs under jsdom + a hand-rolled `navigator.serviceWorker`
 *   fake — verifies isSupported / getPermissionState / subscribe /
 *   unsubscribe / getSubscription against a real
 *   `ServiceWorkerRegistration`-shaped mock.
 */

// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { WebPushAdapter } from '@/push/adapters';
import type { IWebPushConfig } from '@/push/interfaces';
import { MockPushSubscription, MockServiceWorkerRegistration } from '@/testing';

/** Base config used by every test. */
const CONFIG: IWebPushConfig = {
  vapidPublicKey: 'BAo0-p256dh-mock-key',
  serviceWorkerScope: '/',
  userVisibleOnly: true,
};

let sw: {
  register: ReturnType<typeof vi.fn>;
  getRegistration: ReturnType<typeof vi.fn>;
};
let originalNavigator: typeof globalThis.navigator | undefined;
let originalNotification: typeof globalThis.Notification | undefined;

beforeEach(() => {
  originalNavigator = globalThis.navigator;
  originalNotification = globalThis.Notification;
  const registration = new MockServiceWorkerRegistration();
  sw = {
    register: vi.fn(),
    getRegistration: vi.fn().mockResolvedValue(registration),
  };
  // Attach the fake service worker + Notification globals.
  Object.defineProperty(globalThis, 'navigator', {
    value: { serviceWorker: sw },
    configurable: true,
    writable: true,
  });
  Object.defineProperty(globalThis, 'PushManager', {
    value: function PushManager() {},
    configurable: true,
    writable: true,
  });
  Object.defineProperty(globalThis, 'Notification', {
    value: {
      permission: 'granted' as NotificationPermission,
      requestPermission: vi.fn().mockResolvedValue('granted'),
    },
    configurable: true,
    writable: true,
  });
});

afterEach(() => {
  Object.defineProperty(globalThis, 'navigator', {
    value: originalNavigator,
    configurable: true,
    writable: true,
  });
  Object.defineProperty(globalThis, 'Notification', {
    value: originalNotification,
    configurable: true,
    writable: true,
  });
  vi.restoreAllMocks();
});

describe('WebPushAdapter — reads', () => {
  it('reports isSupported when navigator + PushManager + Notification exist', () => {
    const adapter = new WebPushAdapter(CONFIG);
    expect(adapter.isSupported()).toBe(true);
  });

  it('reports the current Notification.permission', async () => {
    const adapter = new WebPushAdapter(CONFIG);
    expect(await adapter.getPermissionState()).toBe('granted');
  });

  it('returns null when no subscription exists', async () => {
    const adapter = new WebPushAdapter(CONFIG);
    expect(await adapter.getSubscription()).toBeNull();
  });
});

describe('WebPushAdapter — subscribe', () => {
  it('subscribes and returns the serialised subscription', async () => {
    const registration = new MockServiceWorkerRegistration();
    // Seed the mock with a subscription so `pushManager.subscribe`
    // returns something rather than throwing.
    const sub = new MockPushSubscription();
    registration.simulateExistingSubscription(sub);
    sw.getRegistration.mockResolvedValue(registration);

    const adapter = new WebPushAdapter(CONFIG);
    const result = await adapter.subscribe();
    expect(result.kind).toBe('web');
    // Even though we seeded an existing subscription, the manager
    // reuses it (Chromium's subscribe API doesn't allow a second
    // subscription while one exists).
    expect((result.value as { endpoint: string }).endpoint).toBe(
      'https://push.example.com/subs/test-endpoint'
    );
  });
});

describe('WebPushAdapter — unsubscribe', () => {
  it('returns false when no subscription is active', async () => {
    const adapter = new WebPushAdapter(CONFIG);
    expect(await adapter.unsubscribe()).toBe(false);
  });

  it('returns true when the active subscription is cancelled', async () => {
    const registration = new MockServiceWorkerRegistration();
    const sub = new MockPushSubscription({ unsubscribeResult: true });
    registration.simulateExistingSubscription(sub);
    sw.getRegistration.mockResolvedValue(registration);

    const adapter = new WebPushAdapter(CONFIG);
    expect(await adapter.unsubscribe()).toBe(true);
  });
});
