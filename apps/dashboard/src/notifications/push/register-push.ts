/**
 * @file register-push.ts
 * @module notifications/push/register-push
 *
 * @description
 * `registerPush()` — user-gesture entrypoint that walks the browser
 * through the Web Push permission + subscription flow, then POSTs the
 * serialised subscription to the backend.
 *
 * ## MUST be called from a user gesture
 *
 * Chrome ignores `Notification.requestPermission()` outside a click /
 * key press and — worse — silently blocks the prompt for the tab
 * indefinitely. Every caller (push permission banner, preferences
 * page) MUST wire this to an `onPress` handler, never an effect or
 * timer.
 *
 * ## PWA migration prerequisite (Phase 2, deferred)
 *
 * The service-worker push handler that renders the OS notification
 * ships in `@academorix/notifications/service-worker/push-handler.ts`.
 * Wiring it requires migrating this app's `vite-plugin-pwa` config
 * from `strategies: "generateSW"` (Workbox auto-generates the SW) to
 * `strategies: "injectManifest"` (we own the SW source). That's a
 * bigger surgery — this file scaffolds every OTHER step so the switch
 * lands with only the vite-plugin-pwa flip.
 *
 * TODO(pwa-strategy): migrate `apps/dashboard/vite.config.ts` (via
 *   `src/config/pwa.config.ts`) to `strategies: "injectManifest"` and
 *   point at a `src/pwa/sw.ts` source file that imports
 *   `handlePushEvent` + `handleNotificationClickEvent` from
 *   `@academorix/notifications/service-worker`. Until that lands,
 *   `showNotification` will never fire because the generated SW knows
 *   nothing about the `push` event.
 *
 * ## Backend gaps
 *
 *  - `POST /notifications/push-subscriptions` — endpoint does NOT
 *    exist yet. Payload:
 *      `{ endpoint, expiration_time, keys: { p256dh, auth }, user_agent, locale }`.
 *  - `DELETE /notifications/push-subscriptions/{id}` — companion for
 *    unsubscribes. Payload: no body, `id` is the row id we get back
 *    from the POST.
 *
 * The frontend wires the calls now so a future backend rev only
 * needs to remove the try/catch swallowing the 404.
 */

import {
  getExistingPushSubscription,
  isPushSupported,
  serializePushSubscription,
  subscribeToPush,
} from "@academorix/notifications";

import { httpClient } from "@/lib/http";
import { fetchVapidPublicKey } from "@/notifications/push/vapid-provider";

/**
 * Endpoint the frontend POSTs the serialised subscription to. Matches
 * NOTIFICATIONS_PLAN §4.2. **Not implemented on the backend yet** —
 * see the module docblock.
 */
export const PUSH_SUBSCRIBE_ENDPOINT = "/notifications/push-subscriptions";

/** Outcomes of {@link registerPush}. */
export type RegisterPushOutcome =
  | { readonly status: "subscribed"; readonly endpoint: string }
  | { readonly status: "already_subscribed"; readonly endpoint: string }
  | { readonly status: "unsupported" }
  | { readonly status: "permission_denied" }
  | { readonly status: "no_registration" }
  | { readonly status: "error"; readonly error: Error };

/**
 * Payload the backend receives when a browser registers a
 * subscription. Kept as an internal type — the shape is stable
 * (see the backend TODO on the module docblock).
 */
interface PushSubscribeRequestBody {
  readonly endpoint: string;
  readonly expiration_time: number | null;
  readonly keys: {
    readonly p256dh: string;
    readonly auth: string;
  };
  readonly user_agent: string;
  readonly locale: string;
}

/**
 * Reads the current SW registration WITHOUT triggering a `register()`
 * call. The registration is provided by `vite-plugin-pwa`'s runtime,
 * which registers on window load in production builds. When it isn't
 * present (dev, non-secure origins), we short-circuit to
 * `no_registration`.
 */
async function readServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  try {
    return (await navigator.serviceWorker.getRegistration()) ?? null;
  } catch {
    return null;
  }
}

/**
 * POSTs a serialised subscription to the backend. Swallows failures
 * intentionally — a 404 here is expected while the endpoint is being
 * built, and blocking the entire flow on that would be user-hostile.
 *
 * @internal Exported for the test suite.
 */
export async function _postSubscriptionToBackend(body: PushSubscribeRequestBody): Promise<void> {
  try {
    // TODO(backend-gap): POST /notifications/push-subscriptions —
    //   endpoint does NOT exist yet. When it lands, remove this try/catch.
    await httpClient.post(PUSH_SUBSCRIBE_ENDPOINT, body);
  } catch {
    // Silent: the browser already has a valid subscription and the SW
    // (once migrated) will render notifications when the backend
    // pushes to `endpoint`. Missing our tracking row is a nice-to-fix,
    // not a blocker.
  }
}

/**
 * Full push registration flow. Prompts for permission if needed,
 * subscribes, and POSTs the payload to the backend.
 *
 * @remarks
 * MUST be called from a user gesture (see file docblock).
 */
export async function registerPush(): Promise<RegisterPushOutcome> {
  if (!isPushSupported()) {
    return { status: "unsupported" };
  }

  const registration = await readServiceWorkerRegistration();

  if (!registration) {
    return { status: "no_registration" };
  }

  try {
    // Already subscribed? Return the existing endpoint so the caller
    // can decide whether to re-POST (e.g. after a tenant switch).
    const existing = await getExistingPushSubscription(registration);

    if (existing) {
      return { status: "already_subscribed", endpoint: existing.endpoint };
    }

    // Prompt for permission first — the push subscribe call would
    // trigger this anyway, but doing it explicitly lets us short-
    // circuit before touching the VAPID endpoint on denial.
    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      return { status: "permission_denied" };
    }

    const vapidPublicKey = await fetchVapidPublicKey();
    const subscription = await subscribeToPush({ registration, vapidPublicKey });
    const serialised = serializePushSubscription(subscription);

    await _postSubscriptionToBackend({
      endpoint: serialised.endpoint,
      expiration_time: serialised.expirationTime,
      keys: serialised.keys,
      user_agent: typeof navigator === "undefined" ? "" : navigator.userAgent,
      locale: typeof navigator === "undefined" ? "en" : navigator.language,
    });

    return { status: "subscribed", endpoint: subscription.endpoint };
  } catch (caught) {
    return {
      status: "error",
      error: caught instanceof Error ? caught : new Error(String(caught)),
    };
  }
}
