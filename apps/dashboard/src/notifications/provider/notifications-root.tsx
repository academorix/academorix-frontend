/**
 * @file notifications-root.tsx
 * @module notifications/provider/notifications-root
 *
 * @description
 * `<NotificationsRoot>` — mounts the notifications context above the
 * app tree AND runs the presence hooks (inbox sync + toast bridge)
 * inside it.
 *
 * ## Composition
 *
 * Rendered from `apps/dashboard/src/providers.tsx` **inside**
 * `<RefineRoot>` so the presence hooks can read the current
 * `useGetIdentity()` — they need the user id to build the private
 * channel name.
 *
 * Every consumer downstream (bell, drawer, preferences page, pages
 * routed inside AuthenticatedLayout) reads state via
 * {@link "@/notifications/provider/notifications-bundle".useNotifications}.
 *
 * ## Why a wrapper?
 *
 * The context provider from `@academorix/notifications` is a pure
 * state container — it does not fetch, subscribe, or dispatch toasts.
 * The root wraps it with the app-level lifecycle so every consumer
 * gets a live inbox for free.
 */

import type { ReactNode } from "react";

import { useNotificationInboxSync } from "@/notifications/hooks/use-notification-inbox-sync";
import { useNotificationToast } from "@/notifications/hooks/use-notification-toast";
import { NotificationsProvider } from "@/notifications/provider/notifications-bundle";

/** Props for {@link NotificationsRoot}. */
export interface NotificationsRootProps {
  /** Everything downstream — routes, layout, etc. */
  readonly children: ReactNode;
}

/**
 * Presence-only child of {@link NotificationsRoot} — must render
 * INSIDE the provider so the hooks can call `useNotifications()`.
 * Splitting it out keeps the root's JSX legible.
 */
function NotificationsLifecycle(): ReactNode {
  useNotificationInboxSync();
  useNotificationToast();

  return null;
}

/**
 * Mounts the shared notifications context, hydrates it from
 * `GET /notifications`, subscribes to Reverb, and dispatches toasts
 * for new arrivals. Pure passthrough for `children`.
 */
export function NotificationsRoot({ children }: NotificationsRootProps): ReactNode {
  return (
    <NotificationsProvider>
      <NotificationsLifecycle />
      {children}
    </NotificationsProvider>
  );
}
