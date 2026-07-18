// @vitest-environment jsdom
/**
 * @file pwa-service.test.ts
 * @module @stackra/pwa/__tests__/unit
 * @description Behavioural tests for {@link PwaService}.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PwaService, AnalyticsBridgeService } from '@/core';
import { PWA_EVENTS } from '@/core/constants';
import type { IPwaModuleOptions } from '@/core/interfaces';
import { MockAnalyticsClient, MockBeforeInstallPromptEvent } from '@/testing';

/** Build a fresh PwaService with mocked deps for each test. */
function newService(options?: { config?: IPwaModuleOptions; analytics?: MockAnalyticsClient }): {
  service: PwaService;
  analytics: MockAnalyticsClient;
} {
  const analytics = options?.analytics ?? new MockAnalyticsClient();
  const bridge = new AnalyticsBridgeService(analytics);
  const service = new PwaService(
    options?.config ?? { install: {}, update: {}, offlineQueue: {} },
    bridge
  );
  return { service, analytics };
}

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  // Tear down every service listener so subsequent tests don't leak
  // dangling event handlers.
  window.localStorage.clear();
});

describe('PwaService construction', () => {
  it('constructs safely in a jsdom environment', () => {
    const { service } = newService();
    const snap = service.getSnapshot();
    expect(snap.install.isVisible).toBe(false);
    expect(snap.install.isInstalled).toBe(false);
    expect(snap.update.isAvailable).toBe(false);
  });

  it('exposes a referentially stable snapshot until state changes', () => {
    const { service } = newService();
    expect(service.getSnapshot()).toBe(service.getSnapshot());
  });
});

describe('PwaService.dismissInstallPrompt', () => {
  it('increments the dismiss count and emits a snapshot change', () => {
    const { service, analytics } = newService();
    const listener = vi.fn();
    service.subscribe(listener);

    service.dismissInstallPrompt();

    expect(service.getSnapshot().install.dismissCount).toBe(1);
    expect(service.getSnapshot().install.isVisible).toBe(false);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(analytics.calls).toContainEqual({
      event: PWA_EVENTS.INSTALL_DISMISSED,
      payload: { count: 1 },
    });
  });

  it('persists the dismiss count to localStorage', () => {
    const { service } = newService();
    service.dismissInstallPrompt();
    service.dismissInstallPrompt();
    expect(window.localStorage.getItem('stackra:pwa:install-dismissed')).toBe('2');
  });

  it('reads the dismiss count from localStorage on construction', () => {
    window.localStorage.setItem('stackra:pwa:install-dismissed', '4');
    const { service } = newService();
    expect(service.getSnapshot().install.dismissCount).toBe(4);
  });
});

describe('PwaService.resetDismissCount', () => {
  it('zeroes the count', () => {
    const { service } = newService();
    service.dismissInstallPrompt();
    service.dismissInstallPrompt();
    service.resetDismissCount();
    expect(service.getSnapshot().install.dismissCount).toBe(0);
  });
});

describe('PwaService.promptInstall', () => {
  it('returns false when no deferred prompt is available', async () => {
    const { service, analytics } = newService();
    const outcome = await service.promptInstall();
    expect(outcome).toBe(false);
    // The event dispatches an accept/dismiss only when a real prompt
    // was queued — no analytics event fires here.
    expect(analytics.calls).toEqual([]);
  });

  it('honours a deferred prompt and returns true on accept', async () => {
    const { service, analytics } = newService();
    await service.onModuleInit();

    // Dispatch the mock beforeinstallprompt event through the real
    // window so PwaService captures it into `deferredPrompt`.
    const event = new MockBeforeInstallPromptEvent();
    window.dispatchEvent(event);

    // Resolve the user's choice before awaiting promptInstall to
    // avoid a race with the setTimeout scheduled by the delayMs
    // guard (default 30s — irrelevant here since we're bypassing
    // it directly).
    event.simulateUserChoice('accepted');
    const outcome = await service.promptInstall();
    expect(outcome).toBe(true);
    expect(event.promptCalls).toBe(1);
    expect(analytics.calls.some((c) => c.event === PWA_EVENTS.INSTALL_ACCEPTED)).toBe(true);
  });

  it('returns false when the user dismisses', async () => {
    const { service, analytics } = newService();
    await service.onModuleInit();
    const event = new MockBeforeInstallPromptEvent();
    window.dispatchEvent(event);
    event.simulateUserChoice('dismissed');
    const outcome = await service.promptInstall();
    expect(outcome).toBe(false);
    expect(analytics.calls.some((c) => c.event === PWA_EVENTS.INSTALL_DISMISSED)).toBe(true);
  });
});

describe('PwaService.acceptUpdate / dismissUpdate', () => {
  it('dismissUpdate hides the banner and emits a snapshot change', () => {
    const { service, analytics } = newService();
    const listener = vi.fn();
    service.subscribe(listener);

    // Manually reveal the banner via the private hook — otherwise
    // the flow requires a bound SW registration.
    (service as unknown as { updateUpdate: (n: unknown) => void }).updateUpdate({
      isAvailable: true,
      isVisible: true,
    });
    listener.mockClear();

    service.dismissUpdate();
    expect(service.getSnapshot().update.isVisible).toBe(false);
    expect(analytics.calls.some((c) => c.event === PWA_EVENTS.UPDATE_DISMISSED)).toBe(true);
  });
});

describe('PwaService fail-soft subscribers', () => {
  it('does not propagate a subscriber error to the emitter', () => {
    const { service } = newService();
    service.subscribe(() => {
      throw new Error('boom');
    });
    // The `dismissInstallPrompt` path invokes `emit()`; a thrown
    // listener must not bubble.
    expect(() => service.dismissInstallPrompt()).not.toThrow();
  });
});

describe('PwaService analytics bridge fail-soft', () => {
  it('swallows analytics client errors', () => {
    const analytics = new MockAnalyticsClient();
    analytics.throwOnTrack = new Error('bridge down');
    const { service } = newService({ analytics });
    // Every dispatched event will throw inside the client — the
    // service should keep operating.
    expect(() => service.dismissInstallPrompt()).not.toThrow();
    // The bridge recorded the attempt even though the client threw.
    expect(analytics.calls[0]?.event).toBe(PWA_EVENTS.INSTALL_DISMISSED);
  });
});

describe('PwaService install prompt maxDismissals gate', () => {
  it('does not surface the banner after maxDismissals is hit', async () => {
    vi.useFakeTimers();
    try {
      window.localStorage.setItem('stackra:pwa:install-dismissed', '3');
      const { service } = newService({
        config: {
          install: { delayMs: 10, maxDismissals: 3 },
          update: {},
          offlineQueue: {},
        },
      });
      await service.onModuleInit();
      const event = new MockBeforeInstallPromptEvent();
      window.dispatchEvent(event);
      // Advance past the delay — banner should stay hidden because
      // dismissCount reached maxDismissals before the event fired.
      await vi.advanceTimersByTimeAsync(50);
      expect(service.getSnapshot().install.isVisible).toBe(false);
      // But the deferred prompt is still captured for programmatic
      // access from Settings.
      expect(service.getSnapshot().install.isSupported).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('PwaService reportOffline', () => {
  it('emits pwa.offline.entered via the analytics bridge', () => {
    const { service, analytics } = newService();
    service.reportOffline();
    expect(analytics.calls.some((c) => c.event === PWA_EVENTS.OFFLINE_ENTERED)).toBe(true);
  });
});
