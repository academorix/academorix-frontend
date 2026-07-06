/**
 * @file preferences.type.ts
 * @module @academorix/notifications/preferences/preferences.type
 *
 * @description
 * The user's notification preferences: which categories are muted,
 * which channels are enabled per category, quiet hours, DND toggle.
 *
 * Preferences are canonically stored on the backend (per user, per
 * tenant) and hydrated into the client at boot. The client keeps a
 * local copy that changes optimistically on toggle.
 */

import type { NotificationChannel } from "../types/notification.type";

/** Per-category channel toggle map. `true` = enabled, `false` = muted. */
export type CategoryChannelPreferences = Readonly<Record<NotificationChannel, boolean>>;

/**
 * The full preferences payload for a user.
 *
 * @typeParam TCategory - App-specific category union.
 */
export interface NotificationPreferences<TCategory extends string = string> {
  /**
   * Per-category channel toggles. Missing entries fall back to the
   * category's `defaultChannels` declared in
   * `defineNotificationCategories`.
   */
  readonly channels: Readonly<Record<TCategory, CategoryChannelPreferences>>;

  /**
   * Global do-not-disturb — when `true`, mutes every non-mandatory
   * notification regardless of per-category settings. Safety
   * categories with `mandatoryPush: true` still push through.
   */
  readonly dnd: boolean;

  /**
   * Quiet hours in local time. When `null`, no quiet-hour window
   * is active. Format: `{ startHour: 22, endHour: 7 }` = 22:00 to
   * 07:00 (wraps midnight).
   */
  readonly quietHours: QuietHoursWindow | null;
}

/** A single quiet-hours window in local time. */
export interface QuietHoursWindow {
  /** 0–23. Inclusive start hour. */
  readonly startHour: number;
  /** 0–23. Exclusive end hour. */
  readonly endHour: number;
}
