/**
 * @file messaging.ts
 * @module lib/firebase/messaging
 *
 * @description
 * Runtime wrapper around Firebase Cloud Messaging for the dashboard.
 * Owns the singleton `FirebaseApp` + `Messaging` instances, the
 * service-worker registration, and the token lifecycle.
 *
 * Every export is designed to be safe to call unconditionally: when
 * Firebase is not configured, the browser lacks the required web-push
 * APIs, or the user has denied notifications, the functions log a
 * friendly warning and resolve to `null` rather than throwing. That
 * matters because these calls sit on the hot path of the notifications
 * hook + the boot sequence — a rogue exception would take the whole
 * app down.
 *
 * ## Integration points
 *
 * @see src/lib/firebase/config.ts         — resolves env vars into `FirebaseOptions`
 * @see src/lib/firebase/service-worker.ts — builds the SW registration URL
 * @see public/firebase-messaging-sw.js    — background message handler
 * @see src/hooks/use-fcm-registration.ts  — the React consumer
 * @see src/main.tsx                        — the boot-time call site
 */

import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import {
  deleteToken,
  getMessaging,
  getToken,
  isSupported,
  onMessage,
  type MessagePayload,
  type Messaging,
} from "firebase/messaging";

import { firebaseConfig, firebaseVapidKey, isFirebaseConfigured } from "@/lib/firebase/config";
import { buildFcmServiceWorkerUrl } from "@/lib/firebase/service-worker";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

/** Options accepted by {@link initFirebaseMessaging}. */
export type InitFirebaseMessagingOptions = {
  /**
   * Fired every time an `onMessage` payload arrives while the tab has
   * focus. Backgrounded pushes go through the service worker directly
   * and never hit this callback.
   */
  onForegroundMessage?: (payload: MessagePayload) => void;
};

/** Return shape of {@link requestFcmToken}. */
export type FcmTokenResult = {
  token: string;
  refreshedAt: string;
};

// -----------------------------------------------------------------------------
// Module-scoped singletons
// -----------------------------------------------------------------------------

// WHY: Firebase's app + messaging factories are safe to call repeatedly, but
// caching keeps allocations down and — more importantly — ensures the
// `onMessage` subscription is only wired once even if `initFirebaseMessaging`
// is called from multiple mount points.
let firebaseAppInstance: FirebaseApp | null = null;
let messagingInstance: Messaging | null = null;
let messagingUnsubscribe: (() => void) | null = null;
let swRegistration: ServiceWorkerRegistration | null = null;
let initPromise: Promise<Messaging | null> | null = null;

// -----------------------------------------------------------------------------
// Support helpers
// -----------------------------------------------------------------------------

/**
 * Synchronous read of the current notification permission. Returns
 * `'unsupported'` when the browser lacks the Notification API entirely
 * (Safari private tabs, some embedded webviews).
 *
 * WHY: consumers need a permission value at render time; hitting the
 * SDK would force everything to be async.
 */
export function getCurrentPermission(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined") return "unsupported";
  if (!("Notification" in window)) return "unsupported";

  return Notification.permission;
}

/**
 * Synchronous heuristic that returns `true` when the current browser
 * exposes the three APIs Firebase Messaging needs. Because it can
 * only inspect globals, it is a coarser gate than the async
 * `isSupported()` from `firebase/messaging` — that call actually
 * probes the runtime (e.g. some Safari builds ship `PushManager` but
 * still fail during registration). Use this synchronous probe for
 * render-time gating; use {@link initFirebaseMessaging} for the
 * full async verification.
 */
export function hasWebPushSurface(): boolean {
  if (typeof window === "undefined") return false;
  if (typeof navigator === "undefined") return false;

  return "serviceWorker" in navigator && "Notification" in window && "PushManager" in window;
}

/**
 * Return the singleton {@link FirebaseApp}, or `null` when the env
 * vars are not fully configured. Safe to call from any context —
 * SSR-guarded and idempotent across React strict-mode double mounts.
 *
 * WHY: HMR + strict-mode double-mount can call `initializeApp` twice.
 * `getApps()` lets us dedupe without needing a named app.
 *
 * Callers that need messaging should prefer {@link getFirebaseMessaging}
 * or the async {@link initFirebaseMessaging}, which own the full
 * lifecycle (support check + SW registration + listener wiring).
 */
export function getFirebaseApp(): FirebaseApp | null {
  if (firebaseAppInstance) return firebaseAppInstance;
  if (!firebaseConfig) return null;

  firebaseAppInstance = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

  return firebaseAppInstance;
}

/**
 * Return the singleton {@link Messaging} instance, or `null` when
 * Firebase is not configured / the current browser lacks the required
 * web-push surface / `getMessaging()` throws (some in-app WebViews).
 *
 * Synchronous by design — a render-time gate for surfaces that want
 * to know "is FCM available right now?" without awaiting the full
 * async support probe. For the async, definitive check (which also
 * registers the service worker + wires the foreground listener) use
 * {@link initFirebaseMessaging}.
 *
 * WHY: `getMessaging()` can throw on `getMessaging` construction in
 * unsupported environments, so we wrap it in a try/catch and return
 * `null` rather than propagating.
 */
export function getFirebaseMessaging(): Messaging | null {
  if (messagingInstance) return messagingInstance;
  if (!hasWebPushSurface()) return null;

  const app = getFirebaseApp();

  if (!app) return null;

  try {
    messagingInstance = getMessaging(app);

    return messagingInstance;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn("[fcm] getMessaging failed", error);

    return null;
  }
}

// -----------------------------------------------------------------------------
// Service worker
// -----------------------------------------------------------------------------

/**
 * Registers the background SW that owns the FCM push subscription.
 * Returns `null` when the browser lacks SW support or Firebase is not
 * configured.
 *
 * WHY: we register from JS (rather than letting the SDK register on
 * its own) so we can pass the config through a query string. The SDK's
 * built-in registration bakes the SW URL, which would strip our
 * params. Once registered we hand the `ServiceWorkerRegistration` to
 * `getToken` explicitly.
 */
export async function registerFcmServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === "undefined") return null;
  if (!("serviceWorker" in navigator)) return null;
  if (!isFirebaseConfigured()) return null;
  if (swRegistration) return swRegistration;

  try {
    const url = buildFcmServiceWorkerUrl();

    swRegistration = await navigator.serviceWorker.register(url, { scope: "/" });

    return swRegistration;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn("[fcm] service worker registration failed", error);
    swRegistration = null;

    return null;
  }
}

// -----------------------------------------------------------------------------
// Messaging init
// -----------------------------------------------------------------------------

/**
 * Boot the FCM messaging pipeline: initialise the Firebase app, ensure
 * the service worker is registered, and (optionally) wire an
 * `onMessage` listener for foreground pushes.
 *
 * Idempotent — calling twice returns the same promise. Safe to call
 * without any config in place; resolves to `null` when FCM is
 * disabled.
 *
 * ## Listener wiring on repeat calls
 *
 * Only ONE foreground listener is active at a time. Calling this
 * function again with a fresh `onForegroundMessage` transparently
 * replaces the previous listener. That intentionally simplifies the
 * common case (the FCM provider re-mounts under strict mode) at the
 * cost of preventing multiple consumers from listening simultaneously
 * via this helper — surfaces that need their own listener should call
 * `onMessage()` from `firebase/messaging` directly against the
 * instance returned here.
 */
export function initFirebaseMessaging(
  options: InitFirebaseMessagingOptions = {},
): Promise<Messaging | null> {
  // WHY: fold repeat calls onto the first pending promise so the SW
  // registration + `isSupported` check aren't repeated during a
  // strict-mode double render.
  if (!initPromise) {
    initPromise = (async () => {
      if (!isFirebaseConfigured()) {
        // eslint-disable-next-line no-console
        console.warn("[fcm] disabled — VITE_FIREBASE_* env vars are not fully configured");

        return null;
      }

      let supported = false;

      try {
        supported = await isSupported();
      } catch {
        supported = false;
      }

      if (!supported) {
        // eslint-disable-next-line no-console
        console.warn("[fcm] disabled — this browser does not support the Firebase Messaging SDK");

        return null;
      }

      const app = getFirebaseApp();

      if (!app) return null;

      // Fire-and-await SW registration so the token request later can
      // reuse the same registration handle.
      await registerFcmServiceWorker();

      try {
        messagingInstance = getMessaging(app);

        return messagingInstance;
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn("[fcm] getMessaging failed", error);

        return null;
      }
    })();
  }

  // WHY: attach the listener *after* awaiting the cached promise so
  // that repeat callers (e.g. the FCM provider mounting after strict-
  // mode's throwaway first render) still get their toast callback
  // wired even though the boot itself already ran.
  if (options.onForegroundMessage) {
    const handler = options.onForegroundMessage;

    void initPromise.then((messaging) => {
      if (!messaging) return;

      // Replace any previous listener wired via this helper. WHY:
      // stacking listeners would fire every toast twice on strict-mode
      // double mounts.
      if (messagingUnsubscribe) messagingUnsubscribe();
      messagingUnsubscribe = onMessage(messaging, handler);
    });
  }

  return initPromise;
}

// -----------------------------------------------------------------------------
// Token lifecycle
// -----------------------------------------------------------------------------

/**
 * Request a Firebase Cloud Messaging registration token for this
 * browser. Prompts the user for notification permission if they have
 * not yet decided.
 *
 * Returns `null` on every failure path — no permission, no VAPID key,
 * unsupported browser, no SW registration, network hiccup during
 * key retrieval. The caller decides how to communicate the failure.
 */
export async function requestFcmToken(): Promise<FcmTokenResult | null> {
  if (!isFirebaseConfigured()) return null;

  const messaging = await initFirebaseMessaging();

  if (!messaging) return null;
  if (typeof window === "undefined" || !("Notification" in window)) return null;
  if (!firebaseVapidKey) return null;

  // Ask the browser for permission if the user hasn't decided yet.
  // We don't ask again on `denied` — that would violate the browser's
  // "one shot" contract on some engines.
  if (Notification.permission === "default") {
    try {
      const outcome = await Notification.requestPermission();

      if (outcome !== "granted") return null;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn("[fcm] requestPermission failed", error);

      return null;
    }
  }
  if (Notification.permission !== "granted") return null;

  // Ensure we have a SW registration to hand to getToken(). Not doing
  // so causes the SDK to register its own SW at a scope that clashes
  // with our config-injected registration.
  const registration = swRegistration ?? (await registerFcmServiceWorker());

  if (!registration) return null;

  try {
    const token = await getToken(messaging, {
      vapidKey: firebaseVapidKey,
      serviceWorkerRegistration: registration,
    });

    if (!token) return null;

    return { token, refreshedAt: new Date().toISOString() };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn("[fcm] getToken failed", error);

    return null;
  }
}

/**
 * Delete the current FCM token from the browser + Firebase servers.
 * Safe to call when no token exists — the SDK swallows that case.
 */
export async function revokeFcmToken(): Promise<void> {
  if (!messagingInstance) return;

  try {
    await deleteToken(messagingInstance);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn("[fcm] deleteToken failed", error);
  }
}
