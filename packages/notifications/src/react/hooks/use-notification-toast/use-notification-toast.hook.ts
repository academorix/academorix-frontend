/**
 * @file use-notification-toast.hook.ts
 * @module @stackra/notifications/react/hooks
 * @description Bridge new arrivals to the HeroUI toast queue.
 *
 *   Watches the in-app centre for freshly-dispatched notifications
 *   and, when a payload's derived priority is ≥ the
 *   `minimumPriority` threshold, calls `toast.<variant>(...)` from
 *   `@stackra/ui/react`.
 *
 *   The hook is a "presence" hook — it renders no DOM. The first
 *   render after mount is a warm-up: every id already present in
 *   the centre is added to a `seen` set without emitting a toast,
 *   so replaying weeks of history is prevented.
 */

import { useEffect, useRef } from 'react';
import { toast } from '@stackra/ui/react';

import type { NotificationPriority } from '@/core/interfaces';
import { deriveNotificationPriority, mapPriorityToToastVariant } from '@/core/utils';
import { useInAppNotifications } from '../use-in-app-notifications';
import type { IUseNotificationToastOptions } from './use-notification-toast.interface';

/**
 * Priority tier → numeric rank for the `>= threshold` comparison.
 *
 * Higher ranks fire sooner: `urgent` (3) > `high` (2) > `normal` (1)
 * > `low` (0).
 */
const PRIORITY_RANK: Readonly<Record<NotificationPriority, number>> = {
  low: 0,
  normal: 1,
  high: 2,
  urgent: 3,
};

/**
 * Bind the toast bridge. Renders no DOM.
 *
 * @example
 * ```tsx
 * function AppShell() {
 *   useNotificationToast({ minimumPriority: 'high' });
 *   return <MainRoutes />;
 * }
 * ```
 */
export function useNotificationToast(options: IUseNotificationToastOptions = {}): void {
  const { minimumPriority = 'normal', toastExistingOnMount = false } = options;
  const { items } = useInAppNotifications();

  // Ids we have already toasted for. A Set has O(1) membership so
  // the diff below is O(n) in the current list size.
  const seenIds = useRef<Set<string>>(new Set());
  // Discriminate the very first render from subsequent ones — the
  // first render must NOT flood the user with a toast per fixture row.
  const isWarmedUp = useRef(false);

  useEffect(() => {
    if (!isWarmedUp.current) {
      isWarmedUp.current = true;
      if (!toastExistingOnMount) {
        for (const entry of items) {
          seenIds.current.add(entry.id);
        }
        return;
      }
    }

    const threshold = PRIORITY_RANK[minimumPriority];
    for (const entry of items) {
      if (seenIds.current.has(entry.id)) continue;
      seenIds.current.add(entry.id);
      const priority = deriveNotificationPriority(entry.payload);
      if (PRIORITY_RANK[priority] < threshold) continue;
      const variant = mapPriorityToToastVariant(priority);
      const message = entry.payload.title;
      const opts = entry.payload.body ? { description: entry.payload.body } : undefined;
      // HeroUI's `toast` exposes per-variant methods — pick the one
      // matching the derived priority. The `default` variant maps
      // to `toast(message)`; every other variant to its method.
      switch (variant) {
        case 'danger':
          toast.danger(message, opts);
          break;
        case 'warning':
          toast.warning(message, opts);
          break;
        case 'info':
          toast.info(message, opts);
          break;
        case 'success':
          toast.success(message, opts);
          break;
        default:
          toast(message, opts);
      }
    }

    // Trim the seen set if the context resets (e.g. logout).
    if (items.length === 0) {
      seenIds.current.clear();
      isWarmedUp.current = false;
    }
  }, [items, minimumPriority, toastExistingOnMount]);
}
