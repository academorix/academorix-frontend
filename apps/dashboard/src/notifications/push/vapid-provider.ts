/**
 * @file vapid-provider.ts
 * @module notifications/push/vapid-provider
 *
 * @description
 * Sources the Web Push VAPID public key at runtime. Order of
 * preference:
 *
 *   1. `GET /config/vapid` — server-issued, per-environment. Documented
 *      in NOTIFICATIONS_PLAN §4.7. **TODO(backend-gap): endpoint DOES
 *      NOT exist yet.** See Communication module `routes/api.php`.
 *      Expected response shape:
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
 *   2. `VITE_VAPID_PUBLIC_KEY` build-time env var — fallback for local
 *      dev + tenants that pin the key at deploy time. Kept as a plain
 *      env var (not in `env.config.ts`) so it stays inert until the
 *      web-push feature flag is enabled.
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

import { httpClient } from "@/lib/http";
import { unwrapEnvelope } from "@/lib/http/envelope";

/** In-memory cache. `null` = not fetched yet. */
let cachedKey: string | null = null;

/** Path passed to `httpClient.get`. Kept as a constant for tests. */
export const VAPID_ENDPOINT = "/config/vapid";

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
    // TODO(backend-gap): GET /config/vapid — endpoint does NOT exist yet.
    //   See Communication module routes. Response should be a public
    //   base64url string; no auth required (per NOTIFICATIONS_PLAN §4.7).
    const body = await httpClient.get<unknown>(VAPID_ENDPOINT);
    const payload = unwrapEnvelope<VapidPayload>(body);
    const key = extractKey(payload);

    if (key) {
      cachedKey = key;

      return key;
    }
  } catch {
    // Fall through to the env fallback — expected while the endpoint
    // is still being built.
  }

  const envKey =
    typeof import.meta.env === "object"
      ? ((import.meta.env as Record<string, string | undefined>).VITE_VAPID_PUBLIC_KEY ?? "")
      : "";

  if (envKey) {
    cachedKey = envKey;

    return envKey;
  }

  throw new Error(
    "No VAPID public key available. Set VITE_VAPID_PUBLIC_KEY in the dashboard env " +
      "or ship the /config/vapid endpoint (see NOTIFICATIONS_PLAN §4.7).",
  );
}

/**
 * Test helper — clears the in-memory cache. Not exported from the
 * module barrel; only test files import it.
 */
export function _resetVapidCache(): void {
  cachedKey = null;
}
