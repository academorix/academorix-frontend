/**
 * @file push-handler.ts
 * @module @academorix/notifications/service-worker/push-handler
 *
 * @description
 * Service-worker-side helpers that translate an incoming Web Push
 * payload into a `showNotification` call. Imported from the SW
 * source file — NOT the main app bundle.
 *
 * ## Usage
 *
 * ```ts
 * // apps/dashboard/src/pwa/sw.ts (built via Workbox injectManifest)
 * import { handlePushEvent, handleNotificationClickEvent } from "@academorix/notifications/service-worker";
 *
 * self.addEventListener("push", (event) => handlePushEvent(event, self.registration));
 * self.addEventListener("notificationclick", handleNotificationClickEvent);
 * ```
 *
 * ## Payload shape
 *
 * The backend serialises a {@link Notification} DTO as JSON and
 * ships it as the push payload. Field naming is snake_case — see
 * `@academorix/notifications/types`. The SW deserialises + calls
 * `registration.showNotification(title, options)`.
 *
 *  - Title: `payload.title` → fall back to `payload.type` → fall
 *    back to `"New notification"`.
 *  - Body:  `payload.body_preview` → fall back to a generic string.
 *  - Icon:  `/pwa-192x192.png` (constant — apps override in their
 *    manifest, not per-notification).
 *  - Click URL: `payload.data_ref.action_url` when present + a
 *    string; else no navigation.
 *
 * ## Robustness
 *
 * A push event that fails to parse (empty payload, malformed JSON)
 * still shows a generic "New notification" rather than throwing —
 * a thrown exception from the SW push handler drops the
 * notification silently on some browsers, which is worse UX than a
 * generic message.
 */

import type { Notification as AppNotification } from "../types/notification.type";

/**
 * Icon shown on every push notification. Apps that need per-tenant
 * branding should ship it via the web manifest instead of trying to
 * override this per-notification.
 */
const DEFAULT_NOTIFICATION_ICON = "/pwa-192x192.png";

/** Badge (Chrome-only) shown next to the notification title. */
const DEFAULT_NOTIFICATION_BADGE = "/pwa-64x64.png";

/**
 * Parses the push payload into an `AppNotification`, tolerating
 * missing / malformed data by returning `null` — callers render the
 * generic fallback in that case.
 */
function parsePushPayload(event: PushEvent): AppNotification | null {
  if (!event.data) {
    return null;
  }

  try {
    return event.data.json() as AppNotification;
  } catch {
    // Fall through to `null` — caller will render the generic
    // fallback.
    return null;
  }
}

/**
 * Reads `payload.data_ref.action_url` if present and a string,
 * else `undefined`. Never throws.
 */
function extractActionUrl(payload: AppNotification | null): string | undefined {
  if (!payload) {
    return undefined;
  }

  const candidate = payload.data_ref["action_url"];

  return typeof candidate === "string" && candidate.length > 0 ? candidate : undefined;
}

/**
 * Handles a `push` event by rendering a system notification. Call
 * from inside `self.addEventListener("push", ...)` with the event
 * and the SW's `registration` object.
 *
 * The handler wraps everything in `event.waitUntil` so the SW stays
 * alive until the notification is displayed.
 */
export function handlePushEvent(event: PushEvent, registration: ServiceWorkerRegistration): void {
  const payload = parsePushPayload(event);

  const title = payload?.title ?? payload?.type ?? "New notification";
  const options: NotificationOptions = {
    body: payload?.body_preview ?? "You have a new update in Academorix.",
    icon: DEFAULT_NOTIFICATION_ICON,
    badge: DEFAULT_NOTIFICATION_BADGE,
    tag: payload?.id, // dedupe repeat pushes for the same notification
    data: payload,
  };

  event.waitUntil(registration.showNotification(title, options));
}

/**
 * Handles a `notificationclick` event by focusing an existing app
 * window (if any) and navigating to `payload.data_ref.action_url`,
 * or opening a new window when none exists. When no action URL is
 * present, the click just closes the notification.
 *
 * Must be called from the SW's
 * `self.addEventListener("notificationclick", ...)`.
 */
export function handleNotificationClickEvent(event: NotificationEvent): void {
  event.notification.close();

  const payload = event.notification.data as AppNotification | undefined | null;
  const actionUrl = extractActionUrl(payload ?? null);

  event.waitUntil(
    (async () => {
      // Look for an existing app tab we can focus.
      const clientsList = await (self as unknown as { clients: Clients }).clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      for (const client of clientsList) {
        if (
          "focus" in client &&
          typeof client.focus === "function" &&
          (!actionUrl || client.url.startsWith(new URL(actionUrl, client.url).origin))
        ) {
          if (actionUrl && "navigate" in client && typeof client.navigate === "function") {
            await client.navigate(actionUrl);
          }

          return client.focus();
        }
      }

      // No matching tab — open a fresh window. `clients.openWindow`
      // is always defined on the SW's `clients` object, so we
      // guard only on `actionUrl` being present.
      if (actionUrl) {
        await (self as unknown as { clients: Clients }).clients.openWindow(actionUrl);
      }
    })(),
  );
}
