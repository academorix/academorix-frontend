/**
 * @file use-notification-preferences.interface.ts
 * @module @stackra/notifications/react/hooks
 * @description Return shape for {@link useNotificationPreferences}.
 */

import type {
  INotificationPreferences,
  IQuietHoursWindow,
  NotificationCategory,
} from '@/core/interfaces';

/**
 * Value returned by {@link useNotificationPreferences}.
 */
export interface IUseNotificationPreferencesResult {
  /** Reactive preferences snapshot. */
  readonly preferences: INotificationPreferences;
  /** Replace the snapshot wholesale. */
  readonly set: (next: INotificationPreferences) => void;
  /** Merge partial `defaults` into the snapshot. */
  readonly patch: (defaults: Record<string, unknown>) => void;
  /** Set a single `(category, channel)` preference. */
  readonly setChannelEnabled: (
    category: NotificationCategory,
    channel: string,
    enabled: boolean
  ) => void;
  /** Replace the quiet-hours window. */
  readonly setQuietHours: (window: IQuietHoursWindow) => void;
  /** Drop any configured quiet-hours window. */
  readonly clearQuietHours: () => void;
  /** Whether a `(category, channel)` pair is currently enabled. */
  readonly isChannelEnabled: (category: NotificationCategory, channel: string) => boolean;
  /** Whether the current wall-clock moment falls inside quiet hours. */
  readonly isInQuietHours: (now?: Date) => boolean;
}
