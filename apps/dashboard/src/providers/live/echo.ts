/**
 * @file echo.ts
 * @module providers/live/echo
 *
 * @description
 * Lazily constructs and memoises a single Laravel Echo client configured for
 * **Reverb** (which speaks the Pusher protocol). Everything here is loaded via
 * dynamic `import()` so `laravel-echo` and `pusher-js` land in their own async
 * chunk and never inflate the initial bundle — critical because realtime is
 * off entirely in mock mode.
 *
 * The Echo instance authenticates private/presence channels through Laravel's
 * `/broadcasting/auth` endpoint using the current bearer token, so realtime
 * respects the same auth as REST calls.
 *
 * @see IDENTITY_AND_TENANCY_SPEC.md §10 (Reverb on Laravel Cloud)
 */

import type Echo from "laravel-echo";

import { envConfig } from "@/config/env.config";
import { tokenStore } from "@/lib/http";

/** Broadcaster driver we target. Reverb reuses the Pusher client transport. */
type ReverbEcho = Echo<"reverb">;

/** Memoised singleton — created on first subscribe, reused thereafter. */
let echoInstance: ReverbEcho | null = null;
/** In-flight construction promise, to dedupe concurrent first subscribes. */
let echoPromise: Promise<ReverbEcho> | null = null;

/**
 * Returns the shared Echo client, constructing it (and loading the transport
 * libraries) on first call.
 */
export async function getEcho(): Promise<ReverbEcho> {
  if (echoInstance) {
    return echoInstance;
  }

  if (!echoPromise) {
    echoPromise = createEcho();
  }

  echoInstance = await echoPromise;

  return echoInstance;
}

/** Builds the Echo instance from validated env + the current bearer token. */
async function createEcho(): Promise<ReverbEcho> {
  // Dynamic imports keep these heavy deps in a lazy chunk.
  const [{ default: EchoConstructor }, { default: Pusher }] = await Promise.all([
    import("laravel-echo"),
    import("pusher-js"),
  ]);

  // laravel-echo reads the Pusher client off the global scope.
  (globalThis as unknown as { Pusher?: unknown }).Pusher = Pusher;

  const token = tokenStore.getToken();

  return new EchoConstructor<"reverb">({
    broadcaster: "reverb",
    key: envConfig.reverb.appKey,
    wsHost: envConfig.reverb.host,
    wsPort: envConfig.reverb.port,
    wssPort: envConfig.reverb.port,
    forceTLS: envConfig.reverb.scheme === "https",
    enabledTransports: ["ws", "wss"],
    // Private/presence channel authorisation goes through the API with the
    // current bearer token.
    authEndpoint: `${envConfig.apiUrl}/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
        Accept: "application/json",
      },
    },
  });
}

/**
 * Tears down the Echo connection and clears the singleton. Call on logout so a
 * new session reconnects with fresh auth.
 */
export async function disconnectEcho(): Promise<void> {
  if (echoInstance) {
    echoInstance.disconnect();
    echoInstance = null;
    echoPromise = null;
  }
}
