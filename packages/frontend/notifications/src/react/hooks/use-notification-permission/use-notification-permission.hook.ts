/**
 * @file use-notification-permission.hook.ts
 * @module @stackra/notifications/react/hooks
 * @description React binding for {@link NotificationManager}'s
 *   permission surface — reads the current permission reactively
 *   and exposes a `request()` callback.
 */

import { useCallback, useEffect, useState } from "react";
import { useInject } from "@stackra/container/react";

import { NOTIFICATION_MANAGER } from "@/core/constants";
import type { INotificationManager } from "@/core/interfaces";
import type { IUseNotificationPermissionResult } from "./use-notification-permission.interface";

/**
 * Read the current notification permission — updates when the
 * `permissions` API reports a state change (Chromium).
 *
 * @example
 * ```tsx
 * import { useNotificationPermission } from '@stackra/notifications/react';
 * import { Button } from '@stackra/ui/react';
 *
 * function EnablePush({ onGranted }) {
 *   const { permission, request } = useNotificationPermission();
 *   if (permission === 'granted') { onGranted(); return null; }
 *   return <Button onPress={() => request()}>Enable notifications</Button>;
 * }
 * ```
 */
export function useNotificationPermission(): IUseNotificationPermissionResult {
  const manager = useInject<INotificationManager>(NOTIFICATION_MANAGER);

  const initial = manager.getPermissionState();
  const [permission, setPermission] = useState<NotificationPermission>(initial.permission);

  useEffect(() => {
    // Re-sync from the manager on mount — the initial `useState`
    // captured the state at hook-construction time and the browser
    // may have transitioned since (Chrome's site settings toggle).
    setPermission(manager.getPermissionState().permission);

    if (typeof navigator === "undefined" || !navigator.permissions) return;
    let cancelled = false;

    // Subscribe to the browser's own `permissions.query` change
    // event when Chromium supports it. Safari doesn't ship
    // `permissions` — the initial read is the best we can do there.
    void navigator.permissions
      .query({ name: "notifications" as PermissionName })
      .then((status) => {
        if (cancelled) return;
        const onChange = (): void => {
          const next = manager.getPermissionState().permission;
          setPermission(next);
        };
        status.addEventListener("change", onChange);
        onChange();
      })
      .catch(() => {
        // fail-soft — some browsers reject the query with an
        // unknown permission name. Leave the initial state as-is.
      });
    return () => {
      cancelled = true;
    };
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
