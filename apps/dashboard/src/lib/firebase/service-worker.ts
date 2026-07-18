/**
 * @file service-worker.ts
 * @module lib/firebase/service-worker
 *
 * @description
 * Helpers that own the contract between the client-side FCM code and
 * the static service worker at `/firebase-messaging-sw.js`.
 *
 * ## Injection pattern
 *
 * The SW file is served verbatim from `public/` by Vite so it lands at
 * the origin root — a hard requirement of FCM's `getToken()` scope
 * rule. Because Vite copies the file byte-for-byte with no template
 * pass, the Firebase config values (project id, sender id, api key,
 * app id, auth domain) must reach the SW via one of three routes:
 *
 *   1. **Query-string on the register URL** (what this module does).
 *      `navigator.serviceWorker.register('/firebase-messaging-sw.js?apiKey=...&projectId=...')`
 *      and the SW reads them off `self.location.search`. The SW's URL
 *      is part of its identity, so a config change re-registers a new
 *      SW instance automatically — a nice-to-have for rotation.
 *   2. Same-origin fetch on install — added complexity, extra RTT.
 *   3. Vite plugin that templates the SW at build time — freezes the
 *      config at build time and forces a rebuild on rotation.
 *
 * Choice: (1). It is the simplest and lets the identical bundle ship
 * across dev / stg / prd with the config coming from Doppler at
 * runtime rather than at bundle time.
 *
 * ## Integration points
 *
 * @see src/lib/firebase/config.ts      — resolves the values written into the URL
 * @see src/lib/firebase/messaging.ts   — calls {@link registerFcmServiceWorker}
 * @see public/firebase-messaging-sw.js — reads the query params it emits
 */

import type { FirebaseOptions } from "firebase/app";

import { firebaseConfig } from "@/lib/firebase/config";

/** Path the SW is served from (Vite copies `public/*` to the origin root). */
export const FCM_SW_PATH = "/firebase-messaging-sw.js";

// -----------------------------------------------------------------------------
// Query string
// -----------------------------------------------------------------------------

/**
 * The subset of `FirebaseOptions` we send to the background worker.
 * We deliberately drop `storageBucket` / `measurementId` — the SW
 * only needs the messaging-critical fields, and shorter query strings
 * make the SW URL nicer to inspect.
 */
type FcmSwPayload = Pick<
  FirebaseOptions,
  "apiKey" | "authDomain" | "projectId" | "messagingSenderId" | "appId"
>;

/**
 * Build the `?apiKey=…&projectId=…` suffix from the resolved Firebase
 * config. Returns an empty string if the config is missing — the
 * caller should be gating on `isFirebaseConfigured()` before ever
 * hitting this, but the fallback keeps the return type simple.
 *
 * WHY: encode every value with {@link encodeURIComponent} — API keys
 * can contain characters that break URL parsing otherwise (rare, but
 * cheap to be safe).
 */
export function buildFcmServiceWorkerQuery(overrides?: FirebaseOptions | null): string {
  const source = overrides ?? firebaseConfig;

  if (!source) return "";

  const payload: FcmSwPayload = {
    apiKey: source.apiKey,
    authDomain: source.authDomain,
    projectId: source.projectId,
    messagingSenderId: source.messagingSenderId,
    appId: source.appId,
  };

  const params = new URLSearchParams();

  // WHY: iterate over a fixed key list rather than `Object.entries` so
  // TypeScript can prove none of the values are `undefined`.
  for (const key of ["apiKey", "authDomain", "projectId", "messagingSenderId", "appId"] as const) {
    const value = payload[key];

    if (typeof value === "string" && value.length > 0) params.set(key, value);
  }

  return `?${params.toString()}`;
}

/**
 * Full SW URL including the config query string — the exact value
 * passed to `navigator.serviceWorker.register()`.
 */
export function buildFcmServiceWorkerUrl(overrides?: FirebaseOptions | null): string {
  return `${FCM_SW_PATH}${buildFcmServiceWorkerQuery(overrides)}`;
}
