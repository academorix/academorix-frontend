/**
 * @file use-notification-preferences.hook.ts
 * @module @stackra/notifications/native/hooks
 * @description Native mirror of the web
 *   {@link useNotificationPreferences} hook.
 *
 *   Identical implementation — pure `useInject` +
 *   `useSyncExternalStore` against the DI-registered
 *   {@link NotificationPreferencesService}. No DOM primitives, so
 *   the file is a straight port kept under `native/hooks/` for
 *   symmetry.
 */

import { useCallback, useSyncExternalStore } from "react";
import { useInject } from "@stackra/container/react";

import { NOTIFICATION_PREFERENCES_SERVICE } from "@/core/constants";
import type { NotificationPreferencesService } from "@/core";
import type {
  INotificationPreferences,
  IQuietHoursWindow,
  NotificationCategory,
} from "@/core/interfaces";

/**
 * Return shape for the native
 * {@link useNotificationPreferences} hook — mirrors the web
 * hook so consumers stay cross-platform.
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
    enabled: boolean,
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

/**
 * Native preferences hook.
 *
 * @example
 * ```tsx
 * import { useNotificationPreferences } from '@stackra/notifications/native';
 * ```
 */
export function useNotificationPreferences(): IUseNotificationPreferencesResult {
  const service = useInject<NotificationPreferencesService>(NOTIFICATION_PREFERENCES_SERVICE);
  const subscribe = useCallback((cb: () => void) => service.subscribe(cb), [service]);
  const getSnapshot = useCallback(() => service.get(), [service]);
  const preferences = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const set = useCallback((next: INotificationPreferences) => service.set(next), [service]);
  const patch = useCallback(
    (defaults: Record<string, unknown>) => service.patch(defaults),
    [service],
  );
  const setChannelEnabled = useCallback(
    (category: NotificationCategory, channel: string, enabled: boolean) =>
      service.setChannelEnabled(category, channel, enabled),
    [service],
  );
  const setQuietHours = useCallback(
    (window: IQuietHoursWindow) => service.setQuietHours(window),
    [service],
  );
  const clearQuietHours = useCallback(() => service.clearQuietHours(), [service]);
  const isChannelEnabled = useCallback(
    (category: NotificationCategory, channel: string) =>
      service.isChannelEnabled(category, channel),
    [service],
  );
  const isInQuietHours = useCallback((now?: Date) => service.isInQuietHours(now), [service]);

  return {
    preferences,
    set,
    patch,
    setChannelEnabled,
    setQuietHours,
    clearQuietHours,
    isChannelEnabled,
    isInQuietHours,
  };
}
