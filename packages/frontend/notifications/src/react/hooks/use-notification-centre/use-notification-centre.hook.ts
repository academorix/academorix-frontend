/**
 * @file use-notification-centre.hook.ts
 * @module @stackra/notifications/react/hooks
 * @description Read the manager-level snapshot reactively.
 *
 *   `useSyncExternalStore` over
 *   {@link NotificationManager.getSnapshot} — tearing-free under
 *   concurrent React.
 */

import { useCallback, useSyncExternalStore } from 'react';
import { useInject } from '@stackra/container/react';

import { NOTIFICATION_MANAGER } from '@/core/constants';
import type { INotificationManager } from '@/core/interfaces';
import type { IUseNotificationCentreResult } from './use-notification-centre.interface';

/**
 * Subscribe to the notification manager's snapshot — permission
 * state and every registered channel id.
 *
 * @example
 * ```tsx
 * import { useNotificationCentre } from '@stackra/notifications/react';
 *
 * function ChannelDebugger() {
 *   const { channels, permission } = useNotificationCentre();
 *   return <pre>{JSON.stringify({ channels, permission }, null, 2)}</pre>;
 * }
 * ```
 */
export function useNotificationCentre(): IUseNotificationCentreResult {
  const manager = useInject<INotificationManager>(NOTIFICATION_MANAGER);
  const subscribe = useCallback((cb: () => void) => manager.subscribe(cb), [manager]);
  const getSnapshot = useCallback(() => manager.getSnapshot(), [manager]);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
