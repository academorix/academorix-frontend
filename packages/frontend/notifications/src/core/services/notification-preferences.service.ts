/**
 * @file notification-preferences.service.ts
 * @module @stackra/notifications/core/services
 * @description In-memory per-user notification preferences store.
 *
 *   Holds the current {@link INotificationPreferences} object and
 *   exposes:
 *   - `get()` — the current snapshot.
 *   - `set(next)` — replace the snapshot.
 *   - `patch(defaults)` — merge a partial `defaults` map.
 *   - `setQuietHours(window)` / `clearQuietHours()`.
 *   - `isChannelEnabled(category, channel)` — cheap lookup.
 *   - `isInQuietHours(now?)` — wall-clock aware window check.
 *
 *   Snapshot is referentially stable — the identity swaps only on
 *   mutation, giving React consumers reading through
 *   `useSyncExternalStore` a tearing-free contract.
 *
 *   Fans out lifecycle events through the
 *   {@link AnalyticsBridgeService} on every meaningful change —
 *   `preferences.changed` (any mutation), `channel_enabled` /
 *   `channel_disabled` on `setChannelEnabled`, and
 *   `quiet_hours_active` the first time
 *   {@link isInQuietHours} transitions to `true` per instance.
 *
 *   Persistence lives outside this service — consumers wire a
 *   `POST /preferences` writer on top and call `set(next)` after
 *   the network round-trip settles.
 */

import { Injectable, Optional } from '@stackra/container';

import { MANDATORY_ON_MATRIX, NOTIFICATION_EVENTS, type NotificationEventName } from '../constants';
import type {
  INotificationPreferences,
  IQuietHoursWindow,
  NotificationCategory,
} from '../interfaces';
import { isQuietHoursWindow } from '../utils';
import { AnalyticsBridgeService } from './analytics-bridge.service';

/** Listener signature — receives no argument. */
export type NotificationPreferencesListener = () => void;

/** Fresh, sensible-default preferences shape. */
function buildInitial(): INotificationPreferences {
  return {
    defaults: {},
    per_child: {},
    quiet_hours: {},
  };
}

/**
 * Discriminates which slice of the snapshot the current mutation
 * flipped. `defaults` covers `patch(...)` + `setChannelEnabled(...)`
 * + `set(...)`; `quiet_hours` covers `setQuietHours(...)` +
 * `clearQuietHours(...)`; `per_child` is reserved for the future
 * per-child overrides bag.
 */
type PreferencesChangeField = 'defaults' | 'quiet_hours' | 'per_child';

/**
 * Notification preferences store.
 *
 * @example
 * ```typescript
 * const preferences = app.get(NOTIFICATION_PREFERENCES_SERVICE);
 * const enabled = preferences.isChannelEnabled('operational', 'in-app');
 * ```
 */
@Injectable()
export class NotificationPreferencesService {
  /** Current preferences snapshot. */
  private preferences: INotificationPreferences = buildInitial();

  /** Registered listeners. */
  private readonly listeners = new Set<NotificationPreferencesListener>();

  /**
   * Latch used to fire `quiet_hours_active` exactly once per
   * transition. Set to `true` after the first `isInQuietHours()`
   * call that returns `true`; reset to `false` any time it returns
   * `false` so a later transition fires the event again.
   */
  private quietHoursActive = false;

  public constructor(
    // AnalyticsBridgeService is a peer within the same package — the
    // container resolves it optionally so tests can spin up the
    // service without wiring analytics.
    @Optional() private readonly analytics?: AnalyticsBridgeService
  ) {}

  // ── Reads ────────────────────────────────────────────────────────

  /** Referentially stable snapshot. */
  public get(): INotificationPreferences {
    return this.preferences;
  }

  /**
   * Whether a `(category, channel)` pair is enabled.
   *
   * Mandatory-on pairs (safety × os-notification) always return
   * `true`. Missing keys default to `true` — the module's
   * default-allow rule.
   */
  public isChannelEnabled(category: NotificationCategory, channel: string): boolean {
    const mandatory = MANDATORY_ON_MATRIX[category] ?? [];
    if (mandatory.includes(channel)) return true;
    const key = `${category}.${channel}`;
    const value = this.preferences.defaults[key];
    // Default-allow — an undefined key means "no preference set,
    // let it through" so consumers don't have to seed every field.
    if (value === undefined) return true;
    return value !== false;
  }

  /**
   * Whether the current wall-clock moment falls inside the user's
   * configured quiet-hours window.
   *
   * Returns `false` when no window is set, when the timezone lookup
   * fails, or when the current time is outside the window. Fires
   * the `quiet_hours_active` analytics event the first time this
   * transitions from `false` to `true` per service instance — a
   * subsequent transition back to `false` re-arms the latch so the
   * event fires again on the next entry.
   *
   * @param now - Optional `Date` override. Defaults to `new Date()`.
   */
  public isInQuietHours(now: Date = new Date()): boolean {
    const window = this.preferences.quiet_hours;
    if (!isQuietHoursWindow(window)) {
      // No configured window — reset the latch so a later config
      // followed by a re-entry fires the event again.
      this.quietHoursActive = false;
      return false;
    }

    // Read the wall-clock hour + minute in the window's timezone.
    // `Intl.DateTimeFormat` is universally available in Node ≥ 22
    // and every modern browser + jsdom.
    let clock: string;
    try {
      clock = new Intl.DateTimeFormat('en-GB', {
        timeZone: window.timezone,
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      }).format(now);
    } catch {
      // fail-soft — an unknown timezone falls through as
      // "outside window" so a bad config never suppresses
      // notifications.
      this.quietHoursActive = false;
      return false;
    }

    const nowMinutes = parseWallClockMinutes(clock);
    const startMinutes = parseWallClockMinutes(window.start);
    const endMinutes = parseWallClockMinutes(window.end);
    if (nowMinutes < 0 || startMinutes < 0 || endMinutes < 0) {
      this.quietHoursActive = false;
      return false;
    }

    // A window that ends before it starts wraps midnight
    // (`22:00 → 07:00`). Both branches include the start and
    // exclude the end so a 22:00 → 07:00 window suppresses at
    // 22:00:00 and lets a 07:00 dispatch through.
    const inside =
      startMinutes <= endMinutes
        ? nowMinutes >= startMinutes && nowMinutes < endMinutes
        : nowMinutes >= startMinutes || nowMinutes < endMinutes;

    if (inside && !this.quietHoursActive) {
      // First transition into the window — fan out the analytics
      // event with the active window as payload.
      this.quietHoursActive = true;
      this.emitAnalytics(NOTIFICATION_EVENTS.QUIET_HOURS_ACTIVE, {
        start: window.start,
        end: window.end,
        timezone: window.timezone,
      });
    } else if (!inside) {
      // Reset the latch so the NEXT transition to `true` re-fires.
      this.quietHoursActive = false;
    }

    return inside;
  }

  // ── Mutations ────────────────────────────────────────────────────

  /** Replace the snapshot wholesale. */
  public set(next: INotificationPreferences): void {
    this.preferences = next;
    // `set(...)` is a wholesale replacement — omit `changedKeys`
    // so listeners treat it as "everything may have changed"
    // rather than a targeted diff.
    this.emitAnalytics(NOTIFICATION_EVENTS.PREFERENCES_CHANGED, {
      field: 'defaults',
    });
    // Re-arm the quiet-hours latch in case the new snapshot dropped
    // (or replaced) the window — the next `isInQuietHours(...)` call
    // decides whether the latch fires again.
    this.quietHoursActive = false;
    this.emit();
  }

  /** Merge partial `defaults` into the current bag. */
  public patch(defaults: Record<string, unknown>): void {
    this.preferences = {
      ...this.preferences,
      defaults: { ...this.preferences.defaults, ...defaults },
    };
    // `patch(...)` intentionally emits a coarse `defaults` event —
    // per-channel granularity comes from `setChannelEnabled(...)`
    // which is the caller-friendly path for a single toggle.
    this.emitAnalytics(NOTIFICATION_EVENTS.PREFERENCES_CHANGED, {
      field: 'defaults',
      changedKeys: Object.keys(defaults),
    });
    this.emit();
  }

  /** Set a channel preference for a single `(category, channel)` pair. */
  public setChannelEnabled(
    category: NotificationCategory,
    channel: string,
    enabled: boolean
  ): void {
    // Mandatory pairs are locked ON — silently ignore attempts to
    // disable them so callers don't need to duplicate the check.
    // Skipping the mutation ALSO skips the analytics event: a
    // no-op call is not a "channel disabled" moment.
    const mandatory = MANDATORY_ON_MATRIX[category] ?? [];
    if (mandatory.includes(channel) && !enabled) return;

    const key = `${category}.${channel}`;
    // Compute the "before" state for enable/disable comparison —
    // callers set the same value twice in some UIs (double-tap
    // debounces, controlled forms) and we only fan out events on a
    // real transition.
    const previous = this.isChannelEnabled(category, channel);

    this.preferences = {
      ...this.preferences,
      defaults: { ...this.preferences.defaults, [key]: enabled },
    };

    // Fire the coarse "preferences.changed" event with the exact
    // key the caller flipped so listeners can rebuild per-channel
    // views without re-reading the whole map.
    this.emitAnalytics(NOTIFICATION_EVENTS.PREFERENCES_CHANGED, {
      field: 'defaults',
      changedKeys: [key],
    });

    // Fire a finer-grained enable/disable event only when the
    // logical state actually changed.
    if (enabled && !previous) {
      this.emitAnalytics(NOTIFICATION_EVENTS.CHANNEL_ENABLED, {
        category,
        channel,
      });
    } else if (!enabled && previous) {
      this.emitAnalytics(NOTIFICATION_EVENTS.CHANNEL_DISABLED, {
        category,
        channel,
      });
    }

    this.emit();
  }

  /** Replace the quiet-hours window. */
  public setQuietHours(window: IQuietHoursWindow): void {
    this.preferences = { ...this.preferences, quiet_hours: window };
    this.emitAnalytics(NOTIFICATION_EVENTS.PREFERENCES_CHANGED, {
      field: 'quiet_hours',
    });
    // Re-arm the quiet-hours latch — a new window may not match
    // the current wall-clock; the next `isInQuietHours(...)` call
    // decides.
    this.quietHoursActive = false;
    this.emit();
  }

  /** Drop any configured quiet-hours window. */
  public clearQuietHours(): void {
    this.preferences = { ...this.preferences, quiet_hours: {} };
    this.emitAnalytics(NOTIFICATION_EVENTS.PREFERENCES_CHANGED, {
      field: 'quiet_hours',
    });
    // No window = never in quiet hours; reset the latch.
    this.quietHoursActive = false;
    this.emit();
  }

  // ── Subscription ─────────────────────────────────────────────────

  /** Subscribe to preferences changes. */
  public subscribe(listener: NotificationPreferencesListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  // ── Private ──────────────────────────────────────────────────────

  /** Fan out to every subscriber. */
  private emit(): void {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch {
        // fail-soft — a broken subscriber must not affect the others.
      }
    }
  }

  /**
   * Analytics fan-out helper. Never throws — the bridge itself
   * swallows every downstream error, but we still guard the call
   * so an unexpected optional-chain hiccup never propagates.
   *
   * @param event - Canonical event name from `NOTIFICATION_EVENTS`.
   * @param payload - Event payload.
   */
  private emitAnalytics(event: NotificationEventName, payload: Record<string, unknown>): void {
    if (!this.analytics) return;
    this.analytics.emit(event, payload);
  }
}

/**
 * Parse `HH:mm` (24-hour) into minutes-since-midnight. Returns
 * `-1` on any parse failure.
 */
function parseWallClockMinutes(clock: string): number {
  // Accept both `HH:mm` (input) and `HH:mm` produced by
  // `Intl.DateTimeFormat.format(...)` — the format string is
  // consistent for `hour: '2-digit', minute: '2-digit'`.
  const [hh, mm] = clock.split(':');
  if (!hh || !mm) return -1;
  const hours = Number(hh);
  const minutes = Number(mm);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return -1;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return -1;
  return hours * 60 + minutes;
}

export type { PreferencesChangeField };
