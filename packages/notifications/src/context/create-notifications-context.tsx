/**
 * @file create-notifications-context.tsx
 * @module @academorix/notifications/context/create-notifications-context
 *
 * @description
 * Factory that returns a `{ NotificationsProvider, useNotifications }`
 * bundle bound to the backend {@link Notification} DTO.
 *
 * The factory shape survives from the pre-refactor version so
 * downstream apps can keep their `useNotifications()` call sites
 * identical, but the generic `TCategory` parameter is gone — the
 * concrete {@link Notification} is a fixed union of channels +
 * statuses, so there's nothing left to parametrise.
 *
 * ## State model
 *
 * The provider holds a normalised list of the user's recent
 * notifications (usually the last 50 the user's inbox stores). It
 * exposes:
 *
 *  - `notifications` — the array (newest first).
 *  - `unreadCount` — derived count for the badge.
 *  - `add(notification)` — prepend a notification (called when a
 *    push / realtime event fires).
 *  - `markRead(id)` — mark a single notification as read (sets
 *    `read_at` + `status: "read"` locally).
 *  - `markAllRead()` — mark every unread notification as read.
 *  - `remove(id)` — drop a notification (dismiss).
 *  - `clear()` — drop everything (usually on logout).
 *
 * The provider is presentation-agnostic — apps decide how to render
 * (HeroUI Popover with a list, native OS panel, side sheet, etc.).
 *
 * ## Persistence
 *
 * Persistence is NOT built in. Apps that want offline resilience
 * pass an `initialNotifications` prop hydrated from a
 * `GET /notifications` fetch on boot; realtime + push events append
 * via `add(...)`. The server is the source of truth.
 *
 * ## TODO — backend endpoints
 *
 * The mark-read + mark-all-read + subscribe / unsubscribe endpoints
 * do not exist yet. See the package README's "TODO — backend
 * endpoints" section.
 */

import { createContext, useCallback, useContext, useMemo, useState } from "react";

import type { Notification } from "../types/notification.type";
import type { ReactNode } from "react";

/** State + actions exposed through the context. */
export interface NotificationsContextValue {
  /** Current notifications, newest first. */
  readonly notifications: readonly Notification[];
  /** Count of entries whose `read_at` is still `null`. */
  readonly unreadCount: number;

  /**
   * Prepend a notification to the list. If a notification with the
   * same `id` already exists, it's replaced in place (dedupe for
   * realtime + push arriving twice).
   */
  readonly add: (notification: Notification) => void;

  /**
   * Mark a single notification as read. Sets `read_at` to the
   * current ISO timestamp and `status` to `"read"`. Idempotent.
   */
  readonly markRead: (id: string) => void;

  /**
   * Mark every unread notification as read. Already-read entries
   * are left untouched (so their `read_at` doesn't drift forward).
   */
  readonly markAllRead: () => void;

  /** Drop a notification from the list. */
  readonly remove: (id: string) => void;

  /** Drop every notification (usually on logout). */
  readonly clear: () => void;
}

/** Props for the {@link NotificationsProvider}. */
export interface NotificationsProviderProps {
  readonly children: ReactNode;
  /**
   * Optional initial notification list — usually hydrated from a
   * `GET /notifications` fetch on boot.
   */
  readonly initialNotifications?: readonly Notification[];
}

/** Bundle returned by {@link createNotificationsContext}. */
export interface NotificationsContextBundle {
  readonly NotificationsProvider: (props: NotificationsProviderProps) => ReactNode;
  readonly useNotifications: () => NotificationsContextValue;
}

/**
 * Creates a `{ NotificationsProvider, useNotifications }` pair.
 *
 * @remarks
 * Kept as a factory (not a package-level singleton) so downstream
 * apps can mount multiple isolated contexts if they ever need to —
 * e.g. a marketing app that renders both a support-agent inbox and
 * a personal inbox at the same time. Most apps call this once at
 * boot and export the returned pair from an app-level module.
 *
 * @example
 * ```tsx
 * // apps/dashboard/src/lib/notifications.ts
 * import { createNotificationsContext } from "@academorix/notifications/context";
 *
 * export const { NotificationsProvider, useNotifications } =
 *   createNotificationsContext();
 * ```
 */
export function createNotificationsContext(): NotificationsContextBundle {
  const NotificationsContext = createContext<NotificationsContextValue | null>(null);

  NotificationsContext.displayName = "NotificationsContext";

  function NotificationsProvider({
    children,
    initialNotifications = [],
  }: NotificationsProviderProps): ReactNode {
    const [notifications, setNotifications] =
      useState<readonly Notification[]>(initialNotifications);

    const add = useCallback((notification: Notification) => {
      setNotifications((current) => {
        const filtered = current.filter((entry) => entry.id !== notification.id);

        return [notification, ...filtered];
      });
    }, []);

    const markRead = useCallback((id: string) => {
      const readAt = new Date().toISOString();

      setNotifications((current) =>
        current.map((entry) =>
          entry.id === id ? { ...entry, read_at: readAt, status: "read" as const } : entry,
        ),
      );
    }, []);

    const markAllRead = useCallback(() => {
      const readAt = new Date().toISOString();

      setNotifications((current) =>
        current.map((entry) =>
          entry.read_at ? entry : { ...entry, read_at: readAt, status: "read" as const },
        ),
      );
    }, []);

    const remove = useCallback((id: string) => {
      setNotifications((current) => current.filter((entry) => entry.id !== id));
    }, []);

    const clear = useCallback(() => {
      setNotifications([]);
    }, []);

    const unreadCount = useMemo(
      () => notifications.filter((entry) => !entry.read_at).length,
      [notifications],
    );

    const value = useMemo<NotificationsContextValue>(
      () => ({ notifications, unreadCount, add, markRead, markAllRead, remove, clear }),
      [notifications, unreadCount, add, markRead, markAllRead, remove, clear],
    );

    return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
  }

  function useNotifications(): NotificationsContextValue {
    const value = useContext(NotificationsContext);

    if (!value) {
      throw new Error(
        "useNotifications must be used within a <NotificationsProvider>. " +
          "Make sure the provider is mounted above the component tree.",
      );
    }

    return value;
  }

  return { NotificationsProvider, useNotifications };
}
