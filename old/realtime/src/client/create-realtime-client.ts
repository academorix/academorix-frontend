/**
 * @file create-realtime-client.ts
 * @module @academorix/realtime/client/create-realtime-client
 *
 * @description
 * Factory that wraps Laravel Echo + `pusher-js` into a minimal
 * {@link RealtimeClient} interface. Transport SDKs are loaded via
 * dynamic `import()` so a lazy consumer (a page that mounts a `<Toast>`
 * ~sometimes~ but never subscribes) pays zero bytes.
 *
 * ## Lifecycle
 *
 *  - `channel`/`private`/`presence` return a lazy
 *    {@link RealtimeChannel}. The channel object is real immediately
 *    (so callers can chain `listen(...)`), but the underlying
 *    subscription doesn't attach until Echo finishes loading. Every
 *    call queued before then is replayed on the real channel once it
 *    resolves.
 *  - `leave` and `disconnect` are async — they await the transport
 *    load before running.
 *
 * ## Auth
 *
 * Private + presence channels authorise via a POST to
 * `config.authEndpoint`. The `config.getAuthHeaders` callback is
 * invoked on every request so tokens can rotate without reconnecting.
 *
 * ## Optional peer dependencies
 *
 * `laravel-echo` and `pusher-js` are optional peer deps — apps only
 * install them when they use realtime. Calls to a client whose
 * transports aren't installed log a warning and no-op (rather than
 * throwing) so the app stays interactive.
 */

import type { RealtimeChannel, RealtimeClient } from "./realtime-client.type";
import type { RealtimeConfig } from "./realtime-config.type";

// Loose transport types — the real SDKs' shapes are matched at
// runtime, and we accept the mismatch here so downstream typecheck
// doesn't need laravel-echo/pusher-js types.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EchoInstance = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EchoModule = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PusherModule = any;

/**
 * Loads `laravel-echo` + `pusher-js` at first call and constructs an
 * Echo instance bound to the caller's Reverb config. Cached so
 * subsequent subscriptions reuse the same transport.
 */
function loadEcho(config: RealtimeConfig): Promise<EchoInstance | null> {
  if (typeof window === "undefined") {
    return Promise.resolve(null);
  }

  return Promise.all([
    import(/* webpackIgnore: true */ "laravel-echo") as Promise<{ default: EchoModule }>,
    import(/* webpackIgnore: true */ "pusher-js") as Promise<{ default: PusherModule }>,
  ])
    .then(([echoModule, pusherModule]) => {
      const EchoConstructor = echoModule.default;
      const Pusher = pusherModule.default;

      // laravel-echo reads the Pusher client off the global scope.
      (globalThis as unknown as { Pusher?: unknown }).Pusher = Pusher;

      return new EchoConstructor({
        broadcaster: "reverb",
        key: config.appKey,
        wsHost: config.host,
        wsPort: config.port,
        wssPort: config.port,
        forceTLS: config.scheme === "https",
        enabledTransports: ["ws", "wss"],
        authEndpoint: config.authEndpoint,
        auth: {
          headers: {
            Accept: "application/json",
            ...(config.getAuthHeaders?.() ?? {}),
          },
        },
      }) as EchoInstance;
    })
    .catch((cause: unknown) => {
      // eslint-disable-next-line no-console
      console.warn(
        "[@academorix/realtime] Failed to load laravel-echo/pusher-js. " +
          "Install them in the consuming app or remove @academorix/realtime usage.",
        cause,
      );

      return null;
    });
}

/**
 * Builds a lazy {@link RealtimeChannel} proxy — records every call
 * made against it and replays them on the real channel once Echo
 * resolves. Callers see a fluent interface immediately.
 */
function createLazyChannel(
  channelName: string,
  echoPromise: Promise<EchoInstance | null>,
  method: "channel" | "private" | "presence",
): RealtimeChannel {
  type QueuedOp = (channel: RealtimeChannel) => void;

  const queue: QueuedOp[] = [];
  let resolved: RealtimeChannel | null = null;

  void echoPromise.then((echo) => {
    if (!echo) {
      return;
    }

    resolved = echo[method](channelName) as RealtimeChannel;

    for (const op of queue) {
      op(resolved);
    }

    queue.length = 0;
  });

  const enqueue = (op: QueuedOp): RealtimeChannel => {
    if (resolved) {
      op(resolved);
    } else {
      queue.push(op);
    }

    return proxy;
  };

  const proxy: RealtimeChannel = {
    listen: (event, callback) =>
      enqueue((channel) => {
        channel.listen(event, callback);
      }),
    listenToAll: (callback) =>
      enqueue((channel) => {
        channel.listenToAll(callback);
      }),
    stopListening: (event) =>
      enqueue((channel) => {
        channel.stopListening(event);
      }),
    here: (callback) =>
      enqueue((channel) => {
        channel.here?.(callback);
      }),
    joining: (callback) =>
      enqueue((channel) => {
        channel.joining?.(callback);
      }),
    leaving: (callback) =>
      enqueue((channel) => {
        channel.leaving?.(callback);
      }),
  };

  return proxy;
}

/**
 * Constructs a {@link RealtimeClient} bound to the caller's Reverb
 * config. Every app instantiates one at boot and reuses it for every
 * subscription.
 *
 * @example
 * ```ts
 * // apps/dashboard/src/lib/realtime.ts
 * import { createRealtimeClient } from "@academorix/realtime/client";
 * import { envConfig } from "@/config/env.config";
 * import { tokenStore } from "@/lib/http";
 *
 * export const realtimeClient = createRealtimeClient({
 *   appKey: envConfig.reverb.appKey,
 *   host: envConfig.reverb.host,
 *   port: envConfig.reverb.port,
 *   scheme: envConfig.reverb.scheme,
 *   authEndpoint: `${envConfig.apiUrl}/broadcasting/auth`,
 *   getAuthHeaders: () => {
 *     const token = tokenStore.getToken();
 *     return token ? { Authorization: `Bearer ${token}` } : {};
 *   },
 * });
 * ```
 */
export function createRealtimeClient(config: RealtimeConfig): RealtimeClient {
  let echoPromise: Promise<EchoInstance | null> | null = null;

  const getEchoPromise = (): Promise<EchoInstance | null> => {
    if (!echoPromise) {
      echoPromise = loadEcho(config);
    }

    return echoPromise;
  };

  return {
    channel(name: string): RealtimeChannel {
      return createLazyChannel(name, getEchoPromise(), "channel");
    },

    private(name: string): RealtimeChannel {
      return createLazyChannel(name, getEchoPromise(), "private");
    },

    presence(name: string): RealtimeChannel {
      return createLazyChannel(name, getEchoPromise(), "presence");
    },

    leave(name: string): void {
      void getEchoPromise().then((echo) => {
        echo?.leave(name);
      });
    },

    async disconnect(): Promise<void> {
      const echo = await getEchoPromise();

      echo?.disconnect();
      echoPromise = null;
    },
  };
}
