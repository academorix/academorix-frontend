/**
 * @file use-notification-preferences.hook.ts
 * @module @stackra/notifications/react/hooks
 * @description React binding for the
 *   {@link NotificationPreferencesService}.
 *
 *   Snapshot subscription via `useSyncExternalStore`; mutations
 *   delegate to the service directly.
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
import type { IUseNotificationPreferencesResult } from "./use-notification-preferences.interface";

/**
 * Preferences hook.
 *
 * @example
 * ```tsx
 * import { useNotificationPreferences } from '@stackra/notifications/react';
 *
 * function Toggle({ category, channel }: { category: NotificationCategory; channel: string }) {
 *   const { isChannelEnabled, setChannelEnabled } = useNotificationPreferences();
 *   const enabled = isChannelEnabled(category, channel);
 *   return <button onClick={() => setChannelEnabled(category, channel, !enabled)}>{String(enabled)}</button>;
 * }
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
