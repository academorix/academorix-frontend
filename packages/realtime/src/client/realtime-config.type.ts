/**
 * @file realtime-config.type.ts
 * @module @academorix/realtime/client/realtime-config.type
 *
 * @description
 * Configuration shape for {@link createRealtimeClient}. Kept as its own
 * file so tests + adapter code can import the type without pulling the
 * client factory (which dynamic-imports the heavy transport SDKs).
 */

/**
 * Reverb + auth configuration for a realtime client.
 *
 * Every field is required unless documented otherwise — the client
 * has no sensible defaults for host/port/appKey.
 */
export interface RealtimeConfig {
  /**
   * The Reverb app key. Broadcasts on the wire are namespaced by this
   * value, so it must match the backend's `REVERB_APP_KEY` env.
   */
  readonly appKey: string;

  /**
   * The Reverb WebSocket host. In production this is same-origin
   * (e.g. `riverside.academorix.app`); in dev it's typically
   * `localhost`.
   */
  readonly host: string;

  /**
   * The Reverb WebSocket port. Reverb defaults to 8080 for
   * `ws:` and 443 for `wss:`.
   */
  readonly port: number;

  /**
   * Scheme — `"http"` (uses `ws://`) or `"https"` (uses `wss://`).
   * Determines the `forceTLS` flag on the Pusher transport.
   */
  readonly scheme: "http" | "https";

  /**
   * Absolute URL of the backend's `/broadcasting/auth` endpoint used
   * for private + presence channel authorisation. Must be same-origin
   * with the SPA in production so cookies + CORS work; in dev this is
   * typically the API origin.
   *
   * @example
   * ```
   * "https://riverside.academorix.app/api/broadcasting/auth"
   * ```
   */
  readonly authEndpoint: string;

  /**
   * Called on every `/broadcasting/auth` request to build the auth
   * headers. The client re-invokes this on each auth challenge so
   * rotating tokens work without reconnecting.
   */
  readonly getAuthHeaders?: () => Record<string, string>;
}
