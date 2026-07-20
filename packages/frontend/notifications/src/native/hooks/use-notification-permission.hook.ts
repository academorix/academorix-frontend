/**
 * @file use-notification-permission.hook.ts
 * @module @stackra/notifications/native/hooks
 * @description Native mirror of the web
 *   {@link useNotificationPermission} hook.
 *
 *   Native permission surface differs from the web: iOS / Android
 *   surface a single OS-level prompt (no `default` state after the
 *   first ask). The hook still exposes the same `NotificationPermission`
 *   shape (`'default' | 'granted' | 'denied'`) so consumers stay
 *   cross-platform — the native manager just returns whichever of
 *   those three values Expo reports.
 */

import { useCallback, useEffect, useState } from 'react';
import { useInject } from '@stackra/container/react';

import { NOTIFICATION_MANAGER } from '@/core/constants';
import type { INotificationManager } from '@/core/interfaces';

/**
 * Return shape for the native
 * {@link useNotificationPermission} hook.
 */
export interface IUseNotificationPermissionResult {
  /** Current permission state (`'default' | 'granted' | 'denied'`). */
  readonly permission: NotificationPermission;
  /** Whether the runtime supports OS-level notifications at all. */
  readonly isSupported: boolean;
  /** Trigger the OS-level prompt and return the resolved state. */
  readonly request: () => Promise<NotificationPermission>;
}

/**
 * Native permission hook.
 *
 * @example
 * ```tsx
 * import { useNotificationPermission } from '@stackra/notifications/native';
 * ```
 */
export function useNotificationPermission(): IUseNotificationPermissionResult {
  const manager = useInject<INotificationManager>(NOTIFICATION_MANAGER);
  const initial = manager.getPermissionState();
  const [permission, setPermission] = useState<NotificationPermission>(initial.permission);

  useEffect(() => {
    // Re-sync from the manager on mount — the initial `useState`
    // captured the state at hook-construction time and the OS may
    // have transitioned since (settings-app toggle).
    setPermission(manager.getPermissionState().permission);
  }, [manager]);

  const request = useCallback(async (): Promise<NotificationPermission> => {
    const result = await manager.requestPermission();
    setPermission(result);
    return result;
  }, [manager]);

  return {
    permission,
    isSupported: manager.getPermissionState().supported,
    request,
  };
}
