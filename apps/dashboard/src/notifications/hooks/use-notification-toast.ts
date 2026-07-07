/**
 * @file use-notification-toast.ts
 * @module notifications/hooks/use-notification-toast
 *
 * @description
 * `useNotificationToast()` — bridges new notifications arriving in the
 * shared context to the app's HeroUI toast queue. Presence hook,
 * renders no DOM.
 *
 * ## Trigger
 *
 * The notifications context (from
 * `@academorix/notifications/context/create-notifications-context`)
 * does not expose an event emitter — it exposes `notifications` as
 * reactive state. We treat the arrival of a new id (one that was NOT
 * present on the previous render) as the "added" event.
 *
 * A per-mount `seenIds` ref bounds the memory usage — we only track
 * the ids the user has been shown a toast for, not the whole history.
 *
 * ## Rules
 *
 *   - The first render after mount is a "warm-up": we mark every
 *     current notification as seen without emitting toasts. Rationale:
 *     the inbox is hydrated on boot from `GET /notifications`, and
 *     replaying weeks of history as toasts is objectively user-hostile.
 *   - `low` priority notifications skip the toast entirely — they are
 *     visible in the drawer only.
 *   - `urgent` toasts are persistent (`timeout: 0`) per
 *     NOTIFICATIONS_PLAN §5.3.
 *
 * ## Analytics
 *
 * Every rendered toast dispatches `notification_shown` telemetry via
 * {@link emitNotificationTelemetry} — never call analytics directly
 * (see `notifications/telemetry.ts` docblock).
 */

import { toast } from "@academorix/ui/react";
import { useEffect, useRef } from "react";

import type { RenderableNotification } from "@/notifications/types";
import type { Notification } from "@academorix/notifications";

import { EVENTS } from "@/config/analytics.config";
import {
  deriveNotificationPriority,
  mapPriorityToToastVariant,
  toastTimeoutForPriority,
} from "@/notifications/priority.util";
import { useNotifications } from "@/notifications/provider/notifications-bundle";
import { emitNotificationTelemetry } from "@/notifications/telemetry";

/**
 * Dispatches a HeroUI toast for a freshly-added notification.
 *
 * Extracted so the render-a-toast path is trivial to unit-test in
 * isolation (see `hooks/__tests__/use-notification-toast.test.ts`,
 * lands with the analytics wiring wave).
 */
export function toastForNotification(notification: Notification): void {
  const priority = deriveNotificationPriority(notification);

  // `low` priority is inbox-only.
  if (priority === "low") {
    return;
  }

  const variant = mapPriorityToToastVariant(priority);
  const title = notification.title ?? "New notification";
  const description = notification.body_preview ?? undefined;
  const timeout = toastTimeoutForPriority(priority);

  // Route through the priority-specific toast method so HeroUI applies
  // its own icon + colour treatment on top of ours.
  const payload = { description, timeout };

  if (variant === "danger") {
    toast.danger(title, payload);
  } else if (variant === "warning") {
    toast.warning(title, payload);
  } else if (variant === "success") {
    toast.success(title, payload);
  } else {
    toast.info(title, payload);
  }

  emitNotificationTelemetry(EVENTS.notificationShown, {
    channel: notification.channel,
    type: notification.type,
    priority,
    surface: "in_app_toast",
  });
}

/**
 * Watches the context for new arrivals and dispatches a toast for
 * each. Warm-up rules:
 *
 *   - First render after mount seeds `seenIds` without emitting.
 *   - Subsequent renders emit a toast for every id that wasn't in
 *     `seenIds` on the previous render.
 */
export function useNotificationToast(): void {
  const { notifications } = useNotifications();

  // Ids we have already toasted for. A Set has O(1) membership so
  // the diff below is O(n) in the current list size.
  const seenIds = useRef<Set<string>>(new Set());

  // Discriminate the very first render from subsequent ones — the
  // first render must NOT flood the user with a toast per fixture row.
  const isWarmedUp = useRef(false);

  useEffect(() => {
    if (!isWarmedUp.current) {
      isWarmedUp.current = true;

      for (const entry of notifications) {
        seenIds.current.add(entry.id);
      }

      return;
    }

    for (const entry of notifications) {
      if (seenIds.current.has(entry.id)) {
        continue;
      }

      seenIds.current.add(entry.id);
      toastForNotification(entry);
    }

    // Trim the seen set if the context resets (e.g. logout).
    if (notifications.length === 0) {
      seenIds.current.clear();
      isWarmedUp.current = false;
    }
  }, [notifications]);
}

/**
 * Convenience helper for tests + Storybook demos. Renders a toast
 * without going through the context. Not exported from the module
 * barrel because production callers must go through the context so
 * the drawer stays in sync.
 */
export function _testRenderNotificationToast(entry: RenderableNotification): void {
  toastForNotification(entry.notification);
}
