/**
 * @file echo-realtime-client.ts
 * @module notifications/realtime/echo-realtime-client
 *
 * @description
 * Thin adapter that projects the dashboard's existing `getEcho()`
 * singleton (see `@/providers/live/echo`) onto the `RealtimeClient`
 * interface from `@academorix/realtime`. Every subscription — whether
 * driven by Refine's live provider or by
 * {@link "@academorix/realtime".useChannel} — flows through the same
 * underlying WebSocket, which:
 *
 *   - Avoids opening a second `laravel-echo`/`pusher-js` connection
 *     just to satisfy the new abstraction.
 *   - Preserves the app-wide auth token propagation the existing
 *     singleton already handles.
 *   - Lets us migrate call sites to the workspace's realtime hooks
 *     one file at a time.
 *
 * ## Why this file lives under `notifications/`
 *
 * The notifications module is the first consumer of
 * `@academorix/realtime` on the dashboard; hosting the adapter here
 * keeps the change scoped to the module's blast radius. When more
 * consumers appear (chat, presence indicators), we lift this to
 * `src/lib/realtime/` and drop the notifications-local re-export.
 *
 * ## Lazy semantics
 *
 * `getEcho()` is asynchronous (the transport modules are dynamically
 * imported). Every `channel/private/presence` call therefore returns
 * a *lazy* {@link RealtimeChannel} proxy that queues `listen(...)` /
 * `stopListening(...)` calls until the transport resolves — matching
 * the semantics of the client
 * `@academorix/realtime/client/create-realtime-client` produces
 * natively.
 */

import type { RealtimeChannel, RealtimeClient } from "@academorix/realtime";

import { getEcho } from "@/providers/live/echo";

/**
 * Loose Echo channel shape — mirrors what our code invokes today
 * (`listen`, `listenToAll`, `stopListening`, plus optional presence
 * callbacks). We intentionally do NOT `import type Echo from
 * "laravel-echo"` here: the workspace treats that dep as lazy-loaded,
 * so types would otherwise leak into an eager import graph.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LiveEcho = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LiveChannel = any;

type QueuedOp = (channel: LiveChannel) => void;

/**
 * Builds a lazy channel proxy for the given `method` (`channel`,
 * `private`, or `presence`). Every method call on the proxy either
 * runs immediately (once Echo resolved) or queues for replay.
 */
function createLazyChannel(
  channelName: string,
  method: "channel" | "private" | "presence",
): RealtimeChannel {
  const queue: QueuedOp[] = [];
  let resolved: LiveChannel | null = null;

  void getEcho().then((echo: LiveEcho) => {
    // Echo.private() / .presence() / .channel() all return a
    // subscription. We funnel each call through the `method` name so
    // the adapter respects the auth semantics of the underlying kind.
    resolved = (echo[method] as (name: string) => LiveChannel)(channelName);

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
        // Presence-only — the underlying channel may not implement
        // `here` for public/private kinds, so guard defensively.
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
 * The shared realtime client — a live view of the app's `getEcho()`
 * singleton conforming to the `RealtimeClient` interface. Every
 * subscription (public / private / presence) is proxied through the
 * same underlying Echo instance.
 *
 * @remarks
 * Constructed as a plain object literal, not a class instance. The
 * module scope guarantees a single reference (imports are memoised
 * by the bundler), so passing this to `useChannel` doesn't create
 * duplicate listeners on re-render.
 */
export const echoRealtimeClient: RealtimeClient = {
  channel(name: string): RealtimeChannel {
    return createLazyChannel(name, "channel");
  },

  private(name: string): RealtimeChannel {
    return createLazyChannel(name, "private");
  },

  presence(name: string): RealtimeChannel {
    return createLazyChannel(name, "presence");
  },

  leave(name: string): void {
    void getEcho().then((echo: LiveEcho) => {
      echo.leave(name);
    });
  },

  async disconnect(): Promise<void> {
    // The dashboard-wide echo singleton owns disconnect via
    // `disconnectEcho()` (called on logout from the auth provider).
    // Consumers of this adapter should NOT call disconnect directly
    // because that would silence every other subscriber on the app —
    // Refine's live provider, presence indicators, etc.
  },
};
