/**
 * @file firebase.ts
 * @module lib/firebase
 *
 * @description
 * Public barrel for the Firebase Cloud Messaging web integration.
 * Everything a UI-layer consumer (provider, hook, page section) needs
 * is re-exported here under the names the FCM design doc specifies:
 *
 *   - {@link firebaseConfig}          — resolved `FirebaseOptions` or `null`
 *   - {@link isFirebaseConfigured}    — boot-time gate
 *   - {@link getFirebaseApp}          — sync `FirebaseApp | null`
 *   - {@link getFirebaseMessaging}    — sync `Messaging | null`
 *   - {@link VAPID_PUBLIC_KEY}        — the web-push public key
 *
 * The heavy lifting lives in three sibling files under `./firebase/`:
 *
 *   - `firebase/config.ts`         — env resolution
 *   - `firebase/messaging.ts`      — runtime SDK wrapper (token lifecycle, listeners)
 *   - `firebase/service-worker.ts` — SW registration URL builder
 *
 * This barrel keeps the public surface small + stable so downstream
 * refactors of the sibling files don't ripple through every import.
 *
 * ## Why not co-locate everything here
 *
 * Keeping the three concerns split lets us test them in isolation +
 * lets the runtime wrapper own the singletons without leaking them
 * into anything imported from a page component. The barrel is a
 * *facade*, not a re-home for the code.
 */

export { firebaseConfig, isFirebaseConfigured, firebaseVapidKey } from "@/lib/firebase/config";
export {
  getCurrentPermission,
  getFirebaseApp,
  getFirebaseMessaging,
  hasWebPushSurface,
  initFirebaseMessaging,
  registerFcmServiceWorker,
  requestFcmToken,
  revokeFcmToken,
  type FcmTokenResult,
  type InitFirebaseMessagingOptions,
} from "@/lib/firebase/messaging";
export {
  buildFcmServiceWorkerQuery,
  buildFcmServiceWorkerUrl,
  FCM_SW_PATH,
} from "@/lib/firebase/service-worker";

import { firebaseVapidKey } from "@/lib/firebase/config";

/**
 * The web-push VAPID public key, or `undefined` when the
 * `VITE_FIREBASE_VAPID_KEY` env var is not populated.
 *
 * WHY: the design doc names it `VAPID_PUBLIC_KEY`. The underlying
 * config module exports the same value as `firebaseVapidKey` — both
 * names point at the same string so callers can pick whichever reads
 * better in context.
 */
export const VAPID_PUBLIC_KEY: string | undefined = firebaseVapidKey;
