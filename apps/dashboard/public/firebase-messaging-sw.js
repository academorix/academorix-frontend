/* eslint-disable no-undef */
/**
 * @file public/firebase-messaging-sw.js
 * @description
 * Firebase Cloud Messaging background service worker for the Academorix
 * dashboard. Serves the origin-root scope FCM's `getToken()` requires — the
 * file MUST live under `/firebase-messaging-sw.js` (Vite copies everything in
 * `public/` verbatim to the origin root, which is exactly what we need).
 *
 * ## Why the compat SDK
 *
 * The modular SDK (`firebase/messaging/sw`) requires a bundler pass to tree-
 * shake and load. A service worker runs outside the app bundle: it is served
 * as a plain static asset, has no access to Vite's module graph, and cannot
 * consume ESM imports without a build step of its own. The compat build is a
 * self-contained UMD bundle designed exactly for this case — one `importScripts`
 * call and `firebase.messaging()` is available on the SW global.
 *
 * We pin the compat SDK to Firebase 11.0.0 to match the `firebase` version in
 * `package.json`. Newer 11.x patch releases are wire-compatible, but pinning
 * keeps rollbacks deterministic.
 *
 * ## Config injection
 *
 * The client registers this SW with the Firebase config appended as query
 * parameters (see `src/lib/firebase/service-worker.ts`):
 *
 *     /firebase-messaging-sw.js?apiKey=...&projectId=...&messagingSenderId=...&appId=...&authDomain=...
 *
 * We read them off `self.location.search` at install time. This is preferred
 * over baking values in at build time because:
 *   - The same static file ships across every environment; config comes from
 *     runtime env vars (Doppler) rather than being frozen at build.
 *   - Changing the config re-registers a new SW automatically (the SW's URL is
 *     part of its identity), so key rotation is picked up on the next load.
 *
 * ## Message handling
 *
 * `onBackgroundMessage` fires when the browser tab is not focused. We surface
 * the payload via the Web Notifications API. Clicking the notification opens
 * `data.click_action` (or `/notifications` as a fallback) — focusing an
 * already-open Academorix tab when one exists.
 */

/* global importScripts, firebase */

// -----------------------------------------------------------------------------
// SDK bootstrap
// -----------------------------------------------------------------------------

/**
 * Version marker for this service worker. Bump manually whenever the
 * SW logic below changes so browsers pick up the new build even when
 * the query-string config is unchanged.
 *
 * WHY: browsers only re-fetch the SW when the URL OR the byte-for-byte
 * content differs. The query string catches config rotations; this
 * constant catches logic-only edits (e.g. a new click-handler branch).
 * The value is intentionally a plain comment-friendly literal — it is
 * never read at runtime, only diffed by the browser's SW installer.
 */
const SW_VERSION = "2025-01-15.1"; // eslint-disable-line no-unused-vars

importScripts("https://www.gstatic.com/firebasejs/11.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/11.0.0/firebase-messaging-compat.js");

/**
 * Parse the Firebase config off the SW's registration URL.
 * WHY: `self.location.search` is the only channel we have to receive
 * per-environment config into a static asset. Failing over to a stub
 * config lets the SW still load (and fail loudly at `getToken` time)
 * rather than crashing during `install`.
 */
function readConfigFromUrl() {
  const params = new URLSearchParams(self.location.search);
  const value = (key) => {
    const raw = params.get(key);

    return typeof raw === "string" && raw.length > 0 ? raw : undefined;
  };

  return {
    apiKey: value("apiKey"),
    authDomain: value("authDomain"),
    projectId: value("projectId"),
    messagingSenderId: value("messagingSenderId"),
    appId: value("appId"),
  };
}

const firebaseConfig = readConfigFromUrl();

// Guard: if the client registered us without config (unexpected in prod but
// possible in dev when env vars are missing), skip messaging entirely so we
// don't spam the console with SDK init errors.
const canInit =
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.messagingSenderId &&
  firebaseConfig.appId;

if (canInit) {
  firebase.initializeApp(firebaseConfig);

  const messaging = firebase.messaging();

  // ---------------------------------------------------------------------------
  // Background push → OS notification
  // ---------------------------------------------------------------------------

  messaging.onBackgroundMessage((payload) => {
    const notification = payload.notification ?? {};
    const data = payload.data ?? {};
    const title = notification.title ?? data.title ?? "Academorix";
    const body = notification.body ?? data.body ?? "";

    // WHY: `click_action` is the FCM-canonical field for a deep link; falling
    // back to `data.url` keeps compatibility with older backend payloads that
    // used the ad-hoc shape.
    const clickAction = data.click_action ?? data.url ?? "/notifications";

    self.registration.showNotification(title, {
      body,
      icon: notification.icon ?? data.icon ?? "/favicon.svg",
      badge: "/favicon.svg",
      tag: data.tag ?? data.category ?? "academorix",
      data: { ...data, click_action: clickAction },
    });
  });
}

// -----------------------------------------------------------------------------
// Click handler
// -----------------------------------------------------------------------------

/**
 * When the user clicks a background notification we:
 *   1. Close the notification chrome.
 *   2. Focus an existing Academorix tab if one is open (the client at that
 *      URL will pick up the deep link via its own foreground handler).
 *   3. Otherwise, open a new tab at the deep link.
 *
 * WHY: `matchAll({includeUncontrolled: true})` picks up tabs opened before the
 * SW's lifecycle started controlling them — otherwise a click right after the
 * first install would always open a new tab.
 */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const raw =
    event.notification.data?.click_action ?? event.notification.data?.url ?? "/notifications";
  // Ensure we always have an absolute URL relative to this SW's origin.
  const target = new URL(raw, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ includeUncontrolled: true, type: "window" }).then((clients) => {
      for (const client of clients) {
        // Focus an open tab if the origins match — the app handles routing
        // client-side after focus.
        if (new URL(client.url).origin === self.location.origin && "focus" in client) {
          if ("navigate" in client) {
            return client
              .navigate(target)
              .then(() => client.focus())
              .catch(() => client.focus());
          }

          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(target);

      return undefined;
    }),
  );
});

// -----------------------------------------------------------------------------
// Lifecycle
// -----------------------------------------------------------------------------

// WHY: skip the "wait for old clients to close" phase so a config change
// (new query string → new SW URL) is picked up on the next page load without
// forcing the operator to close every open tab.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
