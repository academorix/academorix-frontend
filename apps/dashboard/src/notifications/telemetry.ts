/**
 * @file telemetry.ts
 * @module notifications/telemetry
 *
 * @description
 * Fire-and-forget telemetry helper for the notifications subsystem.
 *
 * The dashboard's analytics wiring is a Phase 0 concern (see
 * PLAN.md §wave-1). Until an `@academorix/analytics` client is bound to
 * the app, we emit **synthetic `CustomEvent`s** on `window` under a
 * stable name prefix (`notification:*`) so:
 *
 *  1. e2e tests and dev-tools panels can observe the event stream
 *     without booting a real analytics vendor.
 *  2. When the analytics client lands, it hooks into the same event
 *     names via a single global listener — no per-caller migration.
 *
 * ## Naming
 *
 * The event name uses the wire-format from
 * {@link "@/config/analytics.config".EVENTS} (e.g. `notification_shown`).
 * Callers pass the id via a `name` argument the type system enforces
 * against `EVENTS`.
 *
 * ## PII rule
 *
 * The `props` payload must NOT contain personally identifiable
 * information — no names, no email addresses, no free-text notification
 * bodies. Stick to enums (`category`, `channel`, `type`, `priority`)
 * and small counts.
 *
 * TODO(wave-1): route this through the shared `@academorix/analytics`
 *   client once it's mounted on the dashboard's providers tree. This
 *   file becomes a thin adapter over that client.
 */

import { EVENTS } from "@/config/analytics.config";

/**
 * The subset of {@link EVENTS} whose ids belong to the notifications
 * subsystem. Kept as a runtime constant so tests can assert coverage.
 *
 * Every caller passes one of these values — never a magic string.
 */
export const NOTIFICATION_TELEMETRY_EVENTS = [
  EVENTS.notificationShown,
  EVENTS.notificationClicked,
  EVENTS.notificationDismissed,
  EVENTS.notificationPermissionRequested,
  EVENTS.notificationPermissionGranted,
  EVENTS.notificationPermissionDenied,
  EVENTS.pushSubscriptionCreated,
  EVENTS.pushSubscriptionRenewed,
  EVENTS.pushSubscriptionRevoked,
  EVENTS.notificationCenterOpened,
  EVENTS.notificationSnoozed,
  EVENTS.dndToggled,
] as const;

/** Union of every event name the notifications module may emit. */
export type NotificationTelemetryEvent = (typeof NOTIFICATION_TELEMETRY_EVENTS)[number];

/**
 * Free-form property bag. Keep values small (enums, ids, counts) — do
 * NOT include free-text bodies, names, or emails.
 */
export type NotificationTelemetryProps = Readonly<
  Record<string, string | number | boolean | null | undefined>
>;

/**
 * Name prefix under which every synthetic event fires. The eventual
 * analytics client subscribes to `notification:*` once, then routes the
 * events to whichever provider is configured.
 */
export const NOTIFICATION_TELEMETRY_EVENT_PREFIX = "notification:" as const;

/**
 * Dispatches a `CustomEvent` for a notification action.
 *
 * @param name  - One of {@link NOTIFICATION_TELEMETRY_EVENTS}. Typed so a
 *                typo becomes a build-time error.
 * @param props - Optional property bag (see rules above).
 *
 * @remarks
 * Silent no-op during SSR (`typeof window === "undefined"`) so tests
 * that render server-side don't fail on the dispatch. Failures inside
 * a listener are swallowed on purpose — telemetry must never break the
 * feature it observes.
 */
export function emitNotificationTelemetry(
  name: NotificationTelemetryEvent,
  props: NotificationTelemetryProps = {},
): void {
  if (typeof window === "undefined" || typeof window.dispatchEvent !== "function") {
    return;
  }

  try {
    const event = new CustomEvent(`${NOTIFICATION_TELEMETRY_EVENT_PREFIX}${name}`, {
      detail: { name, props },
    });

    window.dispatchEvent(event);
  } catch {
    // Telemetry must never surface an error to the user.
  }
}
