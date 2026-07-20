/**
 * @fileoverview useNotifications hook — collaboration notification management.
 * @module @stackra/collaboration/hooks
 * @category Hooks
 */

import { useCallback, useEffect, useState } from 'react';

import { useStorage } from '@stackra/storage/react';
import { Str } from '@stackra/support';

import type { CollaborationNotification } from '@/interfaces/notification.interface';

/** Storage key for persisting notifications. */
const STORAGE_KEY = 'collab:notifications';

/**
 * `IStorage` instance name used for notification persistence.
 *
 * Matches the same instance-name convention every other migrated
 * consumer (consent / scope / state / i18n / auth) uses — the app
 * configures a `localStorage` (or matching) instance name in
 * `WebStorageModule.forRoot({ stores })`.
 */
const STORAGE_INSTANCE = 'localStorage';

/** Return type for the useNotifications hook. */
interface UseNotificationsReturn {
  /** All notifications (newest first). */
  notifications: CollaborationNotification[];

  /** Mark a single notification as read. */
  markRead: (id: string) => void;

  /** Mark all notifications as read. */
  markAllRead: () => void;

  /** Count of unread notifications. */
  unreadCount: number;

  /** Add a notification (used internally by other hooks). */
  addNotification: (
    notification: Omit<CollaborationNotification, 'id' | 'read' | 'createdAt'>
  ) => void;
}

/**
 * React hook for managing collaboration notifications.
 *
 * Listens for mention events, replies, and state changes. Persists
 * notifications through `@stackra/storage`'s `useStorage` hook —
 * requires `WebStorageModule` / `NativeStorageModule` imported
 * upstream with a matching store instance.
 *
 * @returns Notification state and actions.
 *
 * @example
 * ```tsx
 * function NotificationBell() {
 *   const { notifications, markAllRead, unreadCount } = useNotifications();
 *
 *   return (
 *     <div>
 *       <button onClick={markAllRead}>
 *         🔔 {unreadCount > 0 && <span>{unreadCount}</span>}
 *       </button>
 *       {notifications.map((n) => (
 *         <div key={n.id} className={n.read ? 'opacity-50' : ''}>
 *           {n.message}
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useNotifications(): UseNotificationsReturn {
  const storage = useStorage(STORAGE_INSTANCE);

  // Start empty; the hydration effect below fills it in from storage.
  // First-render UX: notifications list appears momentarily blank
  // then populates once `storage.get(...)` resolves — matches every
  // other migrated storage-backed hook.
  const [notifications, setNotifications] = useState<CollaborationNotification[]>([]);

  // Initial hydration from the storage backend.
  useEffect(() => {
    let cancelled = false;

    storage
      .get<CollaborationNotification[]>(STORAGE_KEY)
      .then((persisted) => {
        if (cancelled || !persisted) return;
        setNotifications(persisted);
      })
      .catch(() => {
        // fail-soft — hydration failures leave the list empty rather
        // than crash the notification bell.
      });

    return () => {
      cancelled = true;
    };
  }, [storage]);

  // Mirror every state change to storage (fire-and-forget).
  useEffect(() => {
    void storage.set(STORAGE_KEY, notifications);
  }, [notifications, storage]);

  const markRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const addNotification = useCallback(
    (notification: Omit<CollaborationNotification, 'id' | 'read' | 'createdAt'>) => {
      const full: CollaborationNotification = {
        ...notification,
        // `Str.uuid()` from @stackra/support — replaces the previous
        // `Math.random().toString(36).slice(2, 10)` id-gen (a
        // support-utilities violation).
        id: Str.uuid(),
        read: false,
        createdAt: Date.now(),
      };
      setNotifications((prev) => [full, ...prev].slice(0, 50));
    },
    []
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  return { notifications, markRead, markAllRead, unreadCount, addNotification };
}
