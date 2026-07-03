/**
 * @file live-provider.ts
 * @module providers/live/live-provider
 *
 * @description
 * Refine `LiveProvider` implementations:
 *
 * - {@link createReverbLiveProvider} bridges Laravel Reverb broadcasts to
 *   Refine's realtime system. With `liveMode: "auto"`, Refine auto-invalidates
 *   the matching queries when a `created`/`updated`/`deleted` event arrives, so
 *   lists and detail views refresh without manual wiring.
 * - {@link createNoopLiveProvider} is a no-op used in mock mode (no server to
 *   push events).
 *
 * The Laravel backend is expected to broadcast on `resources/{resource}`
 * channels with a payload of the shape `{ ids: BaseKey[] }` so Refine can
 * invalidate the affected records precisely.
 */

import type { LiveEvent, LiveProvider } from "@refinedev/core";

import { getEcho } from "@/providers/live/echo";

/** A subscription handle returned by `subscribe` and consumed by `unsubscribe`. */
interface ReverbSubscription {
  channel: string;
}

/** Minimal shape of the Echo channel methods we use (kept loose for the driver). */
interface ListenableChannel {
  listenToAll(callback: (eventName: string, data: unknown) => void): unknown;
}

/**
 * Maps a Laravel broadcast event name to a Refine live-event type by keyword.
 * Unrecognised events map to `"*"` (a generic change) so nothing is dropped.
 */
function deriveEventType(eventName: string): LiveEvent["type"] {
  const name = eventName.toLowerCase();

  if (name.includes("delete")) {
    return "deleted";
  }

  if (name.includes("update")) {
    return "updated";
  }

  if (name.includes("create")) {
    return "created";
  }

  return "*";
}

/** Coerces an arbitrary broadcast payload into Refine's `LiveEvent["payload"]`. */
function toPayload(data: unknown): LiveEvent["payload"] {
  if (data && typeof data === "object") {
    return data as LiveEvent["payload"];
  }

  return {};
}

/**
 * Builds a live provider backed by Laravel Reverb via Echo.
 *
 * Subscription is wired asynchronously (Echo loads lazily) but `subscribe`
 * returns a handle synchronously so Refine can pair it with `unsubscribe`.
 */
export function createReverbLiveProvider(): LiveProvider {
  return {
    subscribe({ channel, types, callback }): ReverbSubscription {
      // Fire-and-forget: attach listeners once Echo (and its transport) load.
      void getEcho().then((echo) => {
        const subscribed = echo.channel(channel) as unknown as ListenableChannel;

        subscribed.listenToAll((eventName, data) => {
          const type = deriveEventType(eventName);

          if (types.includes("*") || types.includes(type)) {
            callback({
              channel,
              type,
              payload: toPayload(data),
              date: new Date(),
            });
          }
        });
      });

      return { channel };
    },

    unsubscribe(subscription: ReverbSubscription): void {
      if (!subscription?.channel) {
        return;
      }

      void getEcho().then((echo) => {
        echo.leave(subscription.channel);
      });
    },
  };
}

/**
 * Builds a no-op live provider for environments without a realtime server
 * (mock mode). Subscribing does nothing and never emits events.
 */
export function createNoopLiveProvider(): LiveProvider {
  return {
    subscribe(): undefined {
      return undefined;
    },
    unsubscribe(): void {
      // Nothing to tear down.
    },
  };
}
