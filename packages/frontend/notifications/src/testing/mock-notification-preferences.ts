/**
 * @file mock-notification-preferences.ts
 * @module @stackra/notifications/testing
 * @description In-memory `NotificationPreferencesService`-shaped
 *   mock.
 */

import { MANDATORY_ON_MATRIX } from "@/core/constants";
import type {
  INotificationPreferences,
  IQuietHoursWindow,
  NotificationCategory,
} from "@/core/interfaces";

/** Listener signature. */
export type MockNotificationPreferencesListener = () => void;

/**
 * Fresh, sensible-default preferences shape.
 */
function buildInitial(): INotificationPreferences {
  return {
    defaults: {},
    per_child: {},
    quiet_hours: {},
  };
}

/**
 * In-memory notification preferences mock.
 */
export class MockNotificationPreferences {
  private preferences: INotificationPreferences;
  private readonly listeners = new Set<MockNotificationPreferencesListener>();

  /** Toggleable "is in quiet hours" answer — tests set this. */
  public inQuietHours = false;

  public constructor(initial?: {
    /** Seed the preferences. */
    readonly preferences?: INotificationPreferences;
  }) {
    this.preferences = initial?.preferences ?? buildInitial();
  }

  // ── Reads ────────────────────────────────────────────────────────

  public get(): INotificationPreferences {
    return this.preferences;
  }

  public isChannelEnabled(category: NotificationCategory, channel: string): boolean {
    const mandatory = MANDATORY_ON_MATRIX[category] ?? [];
    if (mandatory.includes(channel)) return true;
    const key = `${category}.${channel}`;
    const value = this.preferences.defaults[key];
    if (value === undefined) return true;
    return value !== false;
  }

  public isInQuietHours(_now?: Date): boolean {
    return this.inQuietHours;
  }

  // ── Mutations ────────────────────────────────────────────────────

  public set(next: INotificationPreferences): void {
    this.preferences = next;
    this.emit();
  }

  public patch(defaults: Record<string, unknown>): void {
    this.preferences = {
      ...this.preferences,
      defaults: { ...this.preferences.defaults, ...defaults },
    };
    this.emit();
  }

  public setChannelEnabled(
    category: NotificationCategory,
    channel: string,
    enabled: boolean,
  ): void {
    const mandatory = MANDATORY_ON_MATRIX[category] ?? [];
    if (mandatory.includes(channel) && !enabled) return;
    this.patch({ [`${category}.${channel}`]: enabled });
  }

  public setQuietHours(window: IQuietHoursWindow): void {
    this.preferences = { ...this.preferences, quiet_hours: window };
    this.emit();
  }

  public clearQuietHours(): void {
    this.preferences = { ...this.preferences, quiet_hours: {} };
    this.emit();
  }

  // ── Subscription ─────────────────────────────────────────────────

  public subscribe(listener: MockNotificationPreferencesListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  // ── Test hooks ───────────────────────────────────────────────────

  /** Reset to the initial preferences + drop listeners. */
  public reset(): void {
    this.preferences = buildInitial();
    this.inQuietHours = false;
    this.emit();
  }

  // ── Private ──────────────────────────────────────────────────────

  private emit(): void {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch {
        // fail-soft — a broken subscriber must not affect the others.
      }
    }
  }
}
