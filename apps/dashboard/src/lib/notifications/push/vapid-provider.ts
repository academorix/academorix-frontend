/**
 * @file vapid-provider.ts
 * @module notifications/push/vapid-provider
 *
 * @description
 * Sources the Web Push VAPID public key at runtime. Order of
 * preference:
 *
 *   1. `GET /api/v1/config/vapid` — server-issued, per-environment.
 *      The endpoint returns the public base64url-encoded VAPID key
 *      without requiring auth.
 *
 *      TODO(backend-endpoint): endpoint DOES NOT exist yet. See the
 *      Communication module `routes/tenant.php`. Expected response:
 *
 *      ```json
 *      { "public_key": "<base64url-encoded VAPID public key>" }
 *      ```
 *
 *      OR a Foundation envelope wrapping the same:
 *
 *      ```json
 *      { "data": { "public_key": "…" } }
 *      ```
 *
 *      Both shapes are handled by `unwrapEnvelope` below.
 *
 *   2. `envConfig.vapidPublicKey` (backed by `VITE_VAPID_PUBLIC_KEY`) —
 *      fallback for local dev + tenants that pin the key at deploy
 *      time. Read through the typed env layer rather than
 *      `import.meta.env` directly so any misconfiguration surfaces on
 *      boot (see `config/env.config.ts`).
 *
 * If neither source yields a key, {@link fetchVapidPublicKey} throws.
 * The push subscribe flow catches that + surfaces a friendly error.
 *
 * ## Caching
 *
 * The key rarely changes (once per environment), so we cache the
 * first successful lookup in-memory for the lifetime of the tab. On
 * server rotation the SW's `pushsubscriptionchange` event handles
 * re-subscription — that flow re-runs this function and picks up the
 * new key.
 */

import { envConfig } from "@/config/env.config";
import { NOTIFICATION_ENDPOINTS } from "@/config/notifications.config";
import { httpClient } from "@/lib/http";
import { unwrapEnvelope } from "@/lib/http/envelope";

/** In-memory cache. `null` = not fetched yet. */
let cachedKey: string | null = null;

/**
 * Path passed to `httpClient.get`. Kept as a constant for tests +
 * observability — mirrors {@link NOTIFICATION_ENDPOINTS.vapidPublicKey}.
 */
export const VAPID_ENDPOINT = NOTIFICATION_ENDPOINTS.vapidPublicKey;

/**
 * The response shape both `data`-wrapped and bare responses reduce
 * down to.
 */
interface VapidPayload {
  readonly public_key?: string;
  /** Some backends emit `key` — we accept both. */
  readonly key?: string;
}

/**
 * Reads the key out of a payload of either shape. Returns `undefined`
 * when neither field is present.
 */
function extractKey(payload: VapidPayload | null | undefined): string | undefined {
  if (!payload || typeof payload !== "object") {
    return undefined;
  }

  return payload.public_key ?? payload.key ?? undefined;
}

/**
 * Reads the VAPID public key. Preferences: cache → backend → env fallback.
 *
 * @throws when no key is available.
 */
export async function fetchVapidPublicKey(): Promise<string> {
  if (cachedKey) {
    return cachedKey;
  }

  try {
    // TODO(backend-endpoint): GET /api/v1/config/vapid — endpoint does
    //   NOT exist yet. See Communication module routes. Response
    //   should be a public base64url string; no auth required.
    const body = await httpClient.get<unknown>(VAPID_ENDPOINT);
    const payload = unwrapEnvelope<VapidPayload>(body);
    const key = extractKey(payload);

    if (key) {
      cachedKey = key;

      return key;
    }
  } catch {
    // Fall through to the env fallback — expected while the endpoint
    // is still being built. We do NOT surface the caught error: a
    // 404 here is a normal boot state, not something to log noisily.
  }

  const envKey = envConfig.vapidPublicKey;

  if (envKey) {
    cachedKey = envKey;

    return envKey;
  }

  throw new Error(
    "No VAPID public key available. Set VITE_VAPID_PUBLIC_KEY in the dashboard env " +
      "or ship the /api/v1/config/vapid endpoint (public base64url response, no auth).",
  );
}

/**
 * Test helper — clears the in-memory cache. Not exported from the
 * module barrel; only test files import it.
 */
export function _resetVapidCache(): void {
  cachedKey = null;
}
