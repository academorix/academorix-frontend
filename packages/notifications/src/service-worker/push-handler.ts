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
 * ships it as the push payload. The SW deserialises + calls
 * `registration.showNotification(title, options)`.
 *
 * ## Robustness
 *
 * A push event that fails to parse (empty payload, malformed JSON,
 * missing title) falls back to a generic "New notification"
 * message rather than throwing — a thrown exception from the SW
 * push handler drops the notification silently on some browsers,
 * which is worse UX than a generic message.
 */

import type { Notification as AppNotification } from "../types/notification.type";

/**
 * Parses the push payload into an `AppNotification`, tolerating
 * missing / malformed data by falling back to a generic
 * notification.
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
 * Handles a `push` event by rendering a system notification. Call
 * from inside `self.addEventListener("push", ...)` with the event
 * and the SW's `registration` object.
 *
 * The handler wraps everything in `event.waitUntil` so the SW stays
 * alive until the notification is displayed.
 */
export function handlePushEvent(event: PushEvent, registration: ServiceWorkerRegistration): void {
  const payload = parsePushPayload(event);

  const title = payload?.title ?? "New notification";
  const options: NotificationOptions = {
    body: payload?.body ?? "You have a new update in Academorix.",
    icon: payload?.iconUrl ?? "/pwa-192x192.png",
    badge: "/pwa-64x64.png",
    tag: payload?.id, // dedupe repeat pushes for the same notification
    data: payload,
  };

  event.waitUntil(registration.showNotification(title, options));
}

/**
 * Handles a `notificationclick` event by focusing an existing app
 * window (if any) and navigating to `payload.actionUrl`, or opening
 * a new window when none exists.
 *
 * Must be called from the SW's `self.addEventListener("notificationclick", ...)`.
 */
export function handleNotificationClickEvent(event: NotificationEvent): void {
  event.notification.close();

  const payload = event.notification.data as AppNotification | undefined;
  const actionUrl = payload?.actionUrl;

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
