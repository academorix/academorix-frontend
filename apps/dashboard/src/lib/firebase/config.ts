/**
 * @file config.ts
 * @module lib/firebase/config
 *
 * @description
 * Central Firebase config bootstrap for the dashboard. Reads every
 * `VITE_FIREBASE_*` var Vite injects at build time and hands them to
 * the messaging + service-worker helpers.
 *
 * ## Security model
 *
 * Firebase treats the web `apiKey`, `appId`, `messagingSenderId`, and
 * project id as **public** — they ship in every JS bundle by design.
 * Access to real project data is enforced downstream by Firebase Auth
 * and Firebase Security Rules, not by hiding these values. We still
 * route them through Doppler so dev / stg / prd remain in parity and
 * so key rotation stays a single-command operation.
 *
 * ## Where the values live
 *
 * The Doppler project `academorix-dashboard` holds every var used
 * here across the `dev`, `stg`, and `prd` configs. Pull them locally
 * with `doppler run -- pnpm dev`. The backend's service account JSON
 * — the actually-secret piece — lives on `academorix-backend` under
 * `FIREBASE_CREDENTIALS` and never crosses this module.
 *
 * ## Missing-var behaviour
 *
 * When any required var is absent (typical for a bare `pnpm dev`
 * without Doppler injected), {@link firebaseConfig} returns `null`
 * instead of throwing. Every call site — `initFirebaseMessaging`, the
 * SW registration helper, the UI hook — checks {@link isFirebaseConfigured}
 * first and short-circuits gracefully so the app boots cleanly without
 * FCM.
 *
 * @see src/lib/firebase/messaging.ts     — the runtime SDK wrapper
 * @see src/lib/firebase/service-worker.ts — the SW registration helper
 * @see public/firebase-messaging-sw.js    — the background handler
 */

import type { FirebaseOptions } from "firebase/app";

// -----------------------------------------------------------------------------
// Env narrowing
// -----------------------------------------------------------------------------

// WHY: `import.meta.env` is typed as `Record<string, any>` by Vite's baseline
// types; casting it into a typed shape keeps the rest of the file strict-safe
// without pulling in a project-wide `vite-env.d.ts` augmentation just for FCM.
type FirebaseEnv = {
  VITE_FIREBASE_API_KEY?: string;
  VITE_FIREBASE_AUTH_DOMAIN?: string;
  VITE_FIREBASE_PROJECT_ID?: string;
  VITE_FIREBASE_STORAGE_BUCKET?: string;
  VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
  VITE_FIREBASE_APP_ID?: string;
  VITE_FIREBASE_MEASUREMENT_ID?: string;
  VITE_FIREBASE_VAPID_KEY?: string;
};

const env = import.meta.env as unknown as FirebaseEnv;

/**
 * Returns a trimmed non-empty string, or `undefined` when the raw
 * value is missing / blank / literally `"undefined"` / `"null"`.
 *
 * WHY: Doppler and shell scripts occasionally serialize missing vars
 * as the string `"undefined"`. Treating those as "unset" avoids a
 * class of confusing runtime crashes where the SDK receives the
 * literal text instead of a real key.
 */
function readEnvValue(raw: string | undefined): string | undefined {
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim();

  if (trimmed === "" || trimmed === "undefined" || trimmed === "null") return undefined;

  return trimmed;
}

// -----------------------------------------------------------------------------
// Resolved values
// -----------------------------------------------------------------------------

const apiKey = readEnvValue(env.VITE_FIREBASE_API_KEY);
const authDomain = readEnvValue(env.VITE_FIREBASE_AUTH_DOMAIN);
const projectId = readEnvValue(env.VITE_FIREBASE_PROJECT_ID);
const storageBucket = readEnvValue(env.VITE_FIREBASE_STORAGE_BUCKET);
const messagingSenderId = readEnvValue(env.VITE_FIREBASE_MESSAGING_SENDER_ID);
const appId = readEnvValue(env.VITE_FIREBASE_APP_ID);
const measurementId = readEnvValue(env.VITE_FIREBASE_MEASUREMENT_ID);

/**
 * The web push VAPID public key (`Cloud Messaging → Web Push
 * certificates`). Required by `getToken()` when requesting an FCM
 * registration token; consumers must gate on this being defined.
 */
export const firebaseVapidKey: string | undefined = readEnvValue(env.VITE_FIREBASE_VAPID_KEY);

/**
 * Whether the five required Firebase web client keys are all set.
 *
 * WHY: `storageBucket`, `measurementId`, and the VAPID key are optional
 * for messaging-only usage, but the five below MUST be present or the
 * SDK will throw synchronously on `initializeApp`.
 */
const hasRequiredKeys =
  Boolean(apiKey) &&
  Boolean(authDomain) &&
  Boolean(projectId) &&
  Boolean(messagingSenderId) &&
  Boolean(appId);

/**
 * The final `FirebaseOptions` object handed to `initializeApp` — or
 * `null` when any required var is missing.
 *
 * WHY: Returning `null` instead of throwing keeps the app bootable
 * in developer environments where FCM env vars have not yet been
 * synced. Every downstream consumer checks {@link isFirebaseConfigured}
 * before touching the SDK.
 */
export const firebaseConfig: FirebaseOptions | null = hasRequiredKeys
  ? {
      apiKey: apiKey!,
      authDomain: authDomain!,
      projectId: projectId!,
      messagingSenderId: messagingSenderId!,
      appId: appId!,
      // Optional slots — only included when populated so we don't send
      // literal `undefined` strings across the wire.
      ...(storageBucket ? { storageBucket } : {}),
      ...(measurementId ? { measurementId } : {}),
    }
  : null;

/**
 * True when both the SDK config and the VAPID key are present — i.e.
 * when the client can actually register for web push. Used as the
 * boot-time gate in `main.tsx` and inside the React hook so
 * unsupported environments never surface an error to the user.
 */
export function isFirebaseConfigured(): boolean {
  return (
    firebaseConfig !== null && typeof firebaseVapidKey === "string" && firebaseVapidKey.length > 0
  );
}
