/**
 * @file notification-preferences.service.test.ts
 * @module @stackra/notifications/__tests__/unit
 * @description Behavioural tests for the
 *   {@link NotificationPreferencesService}.
 *
 *   Coverage:
 *   - Default-allow read semantic.
 *   - Explicit disable via `setChannelEnabled`.
 *   - Mandatory-on latch on `safety × os-notification`.
 *   - Whole-snapshot `set(...)`, partial `patch(...)`.
 *   - Subscriber emission on every mutation.
 *   - Quiet-hours wall-clock check + wrap-midnight window +
 *     fail-soft on unknown timezone.
 *   - Analytics fan-out: `preferences.changed` on every mutation,
 *     `channel_enabled` / `channel_disabled` on real transitions
 *     (skipped on mandatory-on pairs), `quiet_hours_active` fires
 *     ONLY on the transition into a window.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AnalyticsBridgeService, NotificationPreferencesService } from '@/core/services';
import { NOTIFICATION_EVENTS } from '@/core/constants';
import type { NotificationCategory } from '@/core/interfaces';

// ══════════════════════════════════════════════════════════════════════════════
// Analytics probe — captures every emit() so tests can assert on it.
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Build a fresh probe that records every `emit` call. The service
 * treats the probe like a bridge with an underlying manager — the
 * probe's `emit` counts events without touching the real one.
 */
function createAnalyticsProbe(): {
  bridge: AnalyticsBridgeService;
  calls: Array<{ event: string; payload?: Record<string, unknown> }>;
} {
  const calls: Array<{ event: string; payload?: Record<string, unknown> }> = [];
  const bridge = new AnalyticsBridgeService();
  // Overwrite the bridge's `emit` so we don't need to mock a full
  // IAnalyticsManager and the constructor stays untouched.
  const spy = vi
    .spyOn(bridge, 'emit')
    .mockImplementation((event: string, payload?: Record<string, unknown>) => {
      calls.push(payload === undefined ? { event } : { event, payload });
    });
  // The spy reference is kept on the returned bridge so `restore`
  // is available to callers who want a per-test teardown.
  (bridge as unknown as { __spy: typeof spy }).__spy = spy;
  return { bridge, calls };
}

describe('NotificationPreferencesService — reads', () => {
  it('returns the default-allow answer when no preference is set', () => {
    const service = new NotificationPreferencesService();
    expect(service.isChannelEnabled('operational', 'in-app')).toBe(true);
  });

  it('honours an explicit disable', () => {
    const service = new NotificationPreferencesService();
    service.setChannelEnabled('operational', 'in-app', false);
    expect(service.isChannelEnabled('operational', 'in-app')).toBe(false);
  });

  it('always reports safety.os-notification as enabled', () => {
    const service = new NotificationPreferencesService();
    // Attempt to disable — the service silently ignores this
    // because safety × os-notification is mandatory.
    service.setChannelEnabled('safety' as NotificationCategory, 'os-notification', false);
    expect(service.isChannelEnabled('safety', 'os-notification')).toBe(true);
  });
});

describe('NotificationPreferencesService — mutations', () => {
  it('replaces the snapshot wholesale via set()', () => {
    const service = new NotificationPreferencesService();
    service.set({
      defaults: { 'operational.email': false },
      per_child: {},
      quiet_hours: {},
    });
    expect(service.isChannelEnabled('operational', 'email')).toBe(false);
  });

  it('merges partial defaults via patch()', () => {
    const service = new NotificationPreferencesService();
    service.patch({ do_not_disturb: true });
    expect(service.get().defaults['do_not_disturb']).toBe(true);
  });

  it('emits to subscribers on every mutation', () => {
    const service = new NotificationPreferencesService();
    let fires = 0;
    service.subscribe(() => {
      fires += 1;
    });
    service.patch({ do_not_disturb: true });
    service.setChannelEnabled('operational', 'in-app', false);
    service.setQuietHours({ start: '22:00', end: '07:00', timezone: 'UTC' });
    service.clearQuietHours();
    expect(fires).toBe(4);
  });
});

describe('NotificationPreferencesService — quiet hours', () => {
  beforeEach(() => {
    // Pin a stable "now" so the wall-clock check is deterministic
    // across CI environments.
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('reports isInQuietHours = false when no window is set', () => {
    const service = new NotificationPreferencesService();
    expect(service.isInQuietHours(new Date('2026-01-15T00:00:00Z'))).toBe(false);
  });

  it('detects a UTC window that wraps midnight (22:00 → 07:00)', () => {
    const service = new NotificationPreferencesService();
    service.setQuietHours({ start: '22:00', end: '07:00', timezone: 'UTC' });
    // 23:00 UTC — inside the window.
    expect(service.isInQuietHours(new Date('2026-01-15T23:00:00Z'))).toBe(true);
    // 05:00 UTC — inside the wrap-around.
    expect(service.isInQuietHours(new Date('2026-01-15T05:00:00Z'))).toBe(true);
    // 12:00 UTC — outside.
    expect(service.isInQuietHours(new Date('2026-01-15T12:00:00Z'))).toBe(false);
  });

  it('detects a non-wrapping window (09:00 → 17:00) in UTC', () => {
    const service = new NotificationPreferencesService();
    service.setQuietHours({ start: '09:00', end: '17:00', timezone: 'UTC' });
    expect(service.isInQuietHours(new Date('2026-01-15T10:00:00Z'))).toBe(true);
    expect(service.isInQuietHours(new Date('2026-01-15T08:59:00Z'))).toBe(false);
    // Boundary — 17:00 is excluded so a 17:00 dispatch fires through.
    expect(service.isInQuietHours(new Date('2026-01-15T17:00:00Z'))).toBe(false);
  });

  it('fail-soft on unknown timezone → false', () => {
    const service = new NotificationPreferencesService();
    service.setQuietHours({
      start: '22:00',
      end: '07:00',
      timezone: 'Not/A_Zone',
    });
    expect(service.isInQuietHours(new Date('2026-01-15T23:00:00Z'))).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Analytics events on preferences changes
// ══════════════════════════════════════════════════════════════════════════════

describe('NotificationPreferencesService — analytics fan-out', () => {
  it('fires PREFERENCES_CHANGED on set() with field=defaults', () => {
    const probe = createAnalyticsProbe();
    const service = new NotificationPreferencesService(probe.bridge);
    service.set({
      defaults: { 'operational.email': false },
      per_child: {},
      quiet_hours: {},
    });
    // The wholesale replace fires PREFERENCES_CHANGED — the
    // payload's `changedKeys` field is intentionally omitted so
    // consumers treat it as "everything may have changed".
    const changed = probe.calls.filter((c) => c.event === NOTIFICATION_EVENTS.PREFERENCES_CHANGED);
    expect(changed).toHaveLength(1);
    expect(changed[0]?.payload).toEqual({ field: 'defaults' });
  });

  it('fires PREFERENCES_CHANGED on patch() with the changed keys', () => {
    const probe = createAnalyticsProbe();
    const service = new NotificationPreferencesService(probe.bridge);
    service.patch({ do_not_disturb: true, marketing_opt_in: false });
    const changed = probe.calls.filter((c) => c.event === NOTIFICATION_EVENTS.PREFERENCES_CHANGED);
    expect(changed).toHaveLength(1);
    expect(changed[0]?.payload).toEqual({
      field: 'defaults',
      changedKeys: ['do_not_disturb', 'marketing_opt_in'],
    });
  });

  it('fires PREFERENCES_CHANGED + CHANNEL_ENABLED on a first-time toggle-on', () => {
    const probe = createAnalyticsProbe();
    const service = new NotificationPreferencesService(probe.bridge);
    // Default is enabled — flip off, then back on. Only the flip
    // BACK ON should emit CHANNEL_ENABLED (the transition).
    service.setChannelEnabled('marketing', 'email', false);
    probe.calls.length = 0;
    service.setChannelEnabled('marketing', 'email', true);
    expect(probe.calls).toEqual([
      {
        event: NOTIFICATION_EVENTS.PREFERENCES_CHANGED,
        payload: { field: 'defaults', changedKeys: ['marketing.email'] },
      },
      {
        event: NOTIFICATION_EVENTS.CHANNEL_ENABLED,
        payload: { category: 'marketing', channel: 'email' },
      },
    ]);
  });

  it('fires PREFERENCES_CHANGED + CHANNEL_DISABLED on a first-time toggle-off', () => {
    const probe = createAnalyticsProbe();
    const service = new NotificationPreferencesService(probe.bridge);
    service.setChannelEnabled('operational', 'in-app', false);
    expect(probe.calls).toEqual([
      {
        event: NOTIFICATION_EVENTS.PREFERENCES_CHANGED,
        payload: { field: 'defaults', changedKeys: ['operational.in-app'] },
      },
      {
        event: NOTIFICATION_EVENTS.CHANNEL_DISABLED,
        payload: { category: 'operational', channel: 'in-app' },
      },
    ]);
  });

  it('does NOT double-emit CHANNEL_ENABLED / DISABLED on a same-state toggle', () => {
    const probe = createAnalyticsProbe();
    const service = new NotificationPreferencesService(probe.bridge);
    // Two disables — only the first is a transition.
    service.setChannelEnabled('operational', 'in-app', false);
    service.setChannelEnabled('operational', 'in-app', false);
    const disables = probe.calls.filter((c) => c.event === NOTIFICATION_EVENTS.CHANNEL_DISABLED);
    expect(disables).toHaveLength(1);
  });

  it('skips CHANNEL_DISABLED for mandatory-on pairs', () => {
    const probe = createAnalyticsProbe();
    const service = new NotificationPreferencesService(probe.bridge);
    // safety × os-notification is mandatory — the setter should
    // silently no-op, so NO event fires.
    service.setChannelEnabled('safety' as NotificationCategory, 'os-notification', false);
    expect(probe.calls).toEqual([]);
  });

  it('fires PREFERENCES_CHANGED on setQuietHours + clearQuietHours', () => {
    const probe = createAnalyticsProbe();
    const service = new NotificationPreferencesService(probe.bridge);
    service.setQuietHours({ start: '22:00', end: '07:00', timezone: 'UTC' });
    service.clearQuietHours();
    const changed = probe.calls.filter((c) => c.event === NOTIFICATION_EVENTS.PREFERENCES_CHANGED);
    expect(changed).toHaveLength(2);
    for (const c of changed) {
      expect(c.payload).toEqual({ field: 'quiet_hours' });
    }
  });

  it('fires QUIET_HOURS_ACTIVE exactly once per transition into a window', () => {
    const probe = createAnalyticsProbe();
    const service = new NotificationPreferencesService(probe.bridge);
    service.setQuietHours({ start: '22:00', end: '07:00', timezone: 'UTC' });
    probe.calls.length = 0;

    // Two consecutive `true` reads inside the window — only ONE
    // transition, so ONE event.
    service.isInQuietHours(new Date('2026-01-15T23:00:00Z'));
    service.isInQuietHours(new Date('2026-01-15T23:30:00Z'));
    let active = probe.calls.filter((c) => c.event === NOTIFICATION_EVENTS.QUIET_HOURS_ACTIVE);
    expect(active).toHaveLength(1);
    expect(active[0]?.payload).toEqual({
      start: '22:00',
      end: '07:00',
      timezone: 'UTC',
    });

    // Transition OUT of the window then back IN should re-fire.
    service.isInQuietHours(new Date('2026-01-15T12:00:00Z'));
    service.isInQuietHours(new Date('2026-01-15T22:30:00Z'));
    active = probe.calls.filter((c) => c.event === NOTIFICATION_EVENTS.QUIET_HOURS_ACTIVE);
    expect(active).toHaveLength(2);
  });
});
