/**
 * @file create-notifications-context.tsx
 * @module @academorix/notifications/context/create-notifications-context
 *
 * @description
 * Factory that returns a typed `{ NotificationsProvider,
 * useNotifications }` bundle for an app.
 *
 * Kept as a factory (not a package-level singleton) so each app can
 * bind the state to its own category union without every downstream
 * `useNotifications()` call site paying `unknown` for
 * `Notification.category`.
 *
 * ## State model
 *
 * The provider holds a normalized list of the user's recent
 * notifications (usually the last 50 the user's inbox stores). It
 * exposes:
 *
 *  - `notifications` — the array (newest first).
 *  - `unreadCount` — derived count for the badge.
 *  - `add(notification)` — prepend a notification (called when a
 *    push / realtime event fires).
 *  - `markRead(id)` — mark a single notification as read.
 *  - `markAllRead()` — mark every notification as read.
 *  - `remove(id)` — drop a notification (dismiss).
 *  - `clear()` — drop everything (usually on logout).
 *
 * The provider is presentation-agnostic — apps decide how to render
 * (HeroUI Popover with a list, native OS panel, side sheet, etc.).
 *
 * ## Persistence
 *
 * Persistence is NOT built in. Apps that want offline resilience
 * pass an `initialNotifications` prop from their `/notifications`
 * fetch on boot; realtime + push events append via `add(...)`. The
 * server is the source of truth.
 */

import { createContext, useCallback, useContext, useMemo, useState } from "react";

import type { Notification } from "../types/notification.type";
import type { ReactNode } from "react";

/** State + actions exposed through the context. */
export interface NotificationsContextValue<TCategory extends string> {
  readonly notifications: readonly Notification<TCategory>[];
  readonly unreadCount: number;

  /**
   * Prepend a notification to the list. If a notification with the
   * same `id` already exists, it's replaced in place (dedupe for
   * realtime + push arriving twice).
   */
  readonly add: (notification: Notification<TCategory>) => void;

  /** Mark a single notification as read. Idempotent. */
  readonly markRead: (id: string) => void;

  /** Mark every notification as read. */
  readonly markAllRead: () => void;

  /** Drop a notification from the list. */
  readonly remove: (id: string) => void;

  /** Drop every notification (usually on logout). */
  readonly clear: () => void;
}

/** Props for a category-bound `NotificationsProvider`. */
export interface NotificationsProviderProps<TCategory extends string> {
  readonly children: ReactNode;
  /**
   * Optional initial notification list — usually hydrated from a
   * `GET /notifications` fetch on boot.
   */
  readonly initialNotifications?: readonly Notification<TCategory>[];
}

/** Bundle returned by {@link createNotificationsContext}. */
export interface NotificationsContextBundle<TCategory extends string> {
  readonly NotificationsProvider: (props: NotificationsProviderProps<TCategory>) => ReactNode;
  readonly useNotifications: () => NotificationsContextValue<TCategory>;
}

/**
 * Creates a `{ NotificationsProvider, useNotifications }` pair
 * bound to the app's concrete category union.
 */
export function createNotificationsContext<
  TCategory extends string,
>(): NotificationsContextBundle<TCategory> {
  const NotificationsContext = createContext<NotificationsContextValue<TCategory> | null>(null);

  NotificationsContext.displayName = "NotificationsContext";

  function NotificationsProvider({
    children,
    initialNotifications = [],
  }: NotificationsProviderProps<TCategory>): ReactNode {
    const [notifications, setNotifications] =
      useState<readonly Notification<TCategory>[]>(initialNotifications);

    const add = useCallback((notification: Notification<TCategory>) => {
      setNotifications((current) => {
        const filtered = current.filter((entry) => entry.id !== notification.id);

        return [notification, ...filtered];
      });
    }, []);

    const markRead = useCallback((id: string) => {
      const readAt = new Date().toISOString();

      setNotifications((current) =>
        current.map((entry) => (entry.id === id ? { ...entry, readAt } : entry)),
      );
    }, []);

    const markAllRead = useCallback(() => {
      const readAt = new Date().toISOString();

      setNotifications((current) =>
        current.map((entry) => (entry.readAt ? entry : { ...entry, readAt })),
      );
    }, []);

    const remove = useCallback((id: string) => {
      setNotifications((current) => current.filter((entry) => entry.id !== id));
    }, []);

    const clear = useCallback(() => {
      setNotifications([]);
    }, []);

    const unreadCount = useMemo(
      () => notifications.filter((entry) => !entry.readAt).length,
      [notifications],
    );

    const value = useMemo<NotificationsContextValue<TCategory>>(
      () => ({ notifications, unreadCount, add, markRead, markAllRead, remove, clear }),
      [notifications, unreadCount, add, markRead, markAllRead, remove, clear],
    );

    return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
  }

  function useNotifications(): NotificationsContextValue<TCategory> {
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
