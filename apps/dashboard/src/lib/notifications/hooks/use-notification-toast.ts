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
 * ## Toast variant selection
 *
 * Per notifications module, specific event types map explicitly to
 * fixed variants regardless of derived priority:
 *
 *   - `invoice.paid`, `coach.checked_in`, `payment_captured`     → `toast.success`
 *   - `attendance.missing`, `attendance_missing`, `payment_retry` → `toast()`   (neutral)
 *   - `safeguarding.alert`, `safeguarding_follow_up`, `security_alert`, `child_safety_alert`
 *                                                                 → `toast.danger`
 *
 * Anything not in the explicit lookup falls back to the priority-based
 * mapping from {@link mapPriorityToToastVariant}. The explicit override
 * lives here (not in `priority.util.ts`) because "priority" is a
 * general concept while these mappings are a UX choice specific to the
 * in-app toast bridge.
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
 *     notifications module
 *   - Every toast carries an **Open** action that navigates to
 *     `data_ref.action_url` when present. Rendered via HeroUI's
 *     `actionProps` slot.
 *
 * ## Analytics
 *
 * Every rendered toast dispatches `notification_shown` telemetry via
 * {@link emitNotificationTelemetry} — never call analytics directly
 * (see `notifications/telemetry.ts` docblock).
 */

import { toast } from "@stackra/ui/react";
import { useEffect, useRef } from "react";

import type { NotificationToastVariant, RenderableNotification } from "@/lib/notifications/types";
import type { Notification } from "@academorix/notifications";

import { EVENTS } from "@/config/analytics.config";
import {
  deriveNotificationPriority,
  mapPriorityToToastVariant,
  toastTimeoutForPriority,
} from "@/lib/notifications/priority.util";
import { useNotifications } from "@/lib/notifications/provider/notifications-bundle";
import { emitNotificationTelemetry } from "@/lib/notifications/telemetry";

/**
 * Explicit event-type → toast variant overrides. Keyed on lowercase
 * `type` strings so a backend that emits either dot- or underscore-
 * separated names still hits the right row.
 *
 * Kept internal so callers can't accidentally paint a `success`
 * variant on a `safeguarding.alert` — the overrides are opinionated
 * on purpose.
 */
const TYPE_VARIANT_OVERRIDES: Readonly<Record<string, NotificationToastVariant>> = {
  "invoice.paid": "success",
  invoice_paid: "success",
  "coach.checked_in": "success",
  coach_checked_in: "success",
  payment_captured: "success",

  "attendance.missing": "default",
  attendance_missing: "default",
  payment_retry: "default",

  "safeguarding.alert": "danger",
  safeguarding_alert: "danger",
  safeguarding_follow_up: "danger",
  security_alert: "danger",
  child_safety_alert: "danger",
};

/**
 * Returns the toast variant to use for a notification, giving
 * priority to explicit overrides before falling back to the derived
 * priority mapping.
 *
 * @internal exported for the toast-bridge unit test.
 */
export function resolveToastVariant(notification: Notification): NotificationToastVariant {
  const override = TYPE_VARIANT_OVERRIDES[notification.type.toLowerCase()];

  if (override) {
    return override;
  }

  return mapPriorityToToastVariant(deriveNotificationPriority(notification));
}

/**
 * Reads a click-target URL from a DTO's `data_ref`, if present. Kept
 * mirror-identical to the row-level helper so both surfaces resolve
 * the same value from the same field.
 */
function extractActionUrl(notification: Notification): string | undefined {
  const candidate = notification.data_ref["action_url"];

  return typeof candidate === "string" && candidate.length > 0 ? candidate : undefined;
}

/**
 * Navigates to `url` using `location.assign`. Absolute URLs escape
 * the SPA; relative URLs still work because the destination is
 * unambiguous on a fresh page load.
 */
function navigateToActionUrl(url: string): void {
  if (typeof window === "undefined") {
    return;
  }

  window.location.assign(url);
}

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

  const variant = resolveToastVariant(notification);
  const title = notification.title ?? "New notification";
  const description = notification.body_preview ?? undefined;
  const timeout = toastTimeoutForPriority(priority);
  const actionUrl = extractActionUrl(notification);

  // Every toast that has an `action_url` gets an "Open" button that
  // navigates on press. Rendered via `actionProps` — HeroUI's
  // recommended slot for the primary CTA per the OSS toast docs.
  const actionProps = actionUrl
    ? {
        children: "Open",
        onPress: (): void => {
          emitNotificationTelemetry(EVENTS.notificationClicked, {
            channel: notification.channel,
            type: notification.type,
            priority,
            surface: "in_app_toast",
          });
          navigateToActionUrl(actionUrl);
        },
      }
    : undefined;

  const payload = {
    description,
    timeout,
    actionProps,
  } as const;

  // Route through the priority-specific toast method so HeroUI
  // applies its own icon + colour treatment. The `default` variant
  // uses the plain `toast()` signature — semantically the "no accent"
  // tier per the plan (e.g. `attendance.missing` — informative, not
  // alarming).
  if (variant === "danger") {
    toast.danger(title, payload);
  } else if (variant === "warning") {
    toast.warning(title, payload);
  } else if (variant === "success") {
    toast.success(title, payload);
  } else if (variant === "accent") {
    toast.info(title, payload);
  } else {
    toast(title, payload);
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
