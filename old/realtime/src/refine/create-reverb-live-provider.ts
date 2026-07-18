/**
 * @file create-reverb-live-provider.ts
 * @module @academorix/realtime/refine/create-reverb-live-provider
 *
 * @description
 * Bridges a {@link RealtimeClient} into Refine's `LiveProvider`
 * contract. With Refine's `liveMode: "auto"`, mutations on any
 * subscribed resource auto-invalidate the matching query, so lists
 * and detail views refresh without manual wiring.
 *
 * ## Event name → Refine type mapping
 *
 * Refine wants an event `type` of `"created"` / `"updated"` /
 * `"deleted"` / `"*"`. Laravel event class names follow the
 * `Xxx{Created,Updated,Deleted}` convention, so we string-match the
 * name and derive the type from it. Unrecognised events map to
 * `"*"` so nothing is silently dropped.
 *
 * ## Backend expectations
 *
 * The backend broadcasts on `resources.{resource}` channels with a
 * payload of `{ ids: string[] }` (matching Refine's expectation for
 * granular cache invalidation). Broader channels — tenant-wide
 * announcements, presence — should use the direct hooks in
 * {@link "@academorix/realtime/hooks"}, not this provider.
 */

import type { LiveEvent, LiveEventType, RefineLiveProvider } from "./reverb-live-provider.type";
import type { RealtimeClient } from "../client/realtime-client.type";

/** Refine's expected subscription handle shape. */
interface ReverbSubscription {
  readonly channel: string;
}

/**
 * Maps a Laravel broadcast event name to a Refine live-event type by
 * keyword.
 */
function deriveEventType(eventName: string): LiveEventType {
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

/** Coerces an arbitrary broadcast payload into Refine's expected shape. */
function toPayload(data: unknown): LiveEvent["payload"] {
  if (data && typeof data === "object") {
    return data as LiveEvent["payload"];
  }

  return {};
}

/**
 * Builds a Refine-compatible `LiveProvider` backed by the passed-in
 * realtime client.
 */
export function createReverbLiveProvider(client: RealtimeClient): RefineLiveProvider {
  return {
    subscribe({ channel, types, callback }): ReverbSubscription {
      const subscribed = client.channel(channel);

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

      return { channel };
    },

    unsubscribe(subscription: unknown): void {
      const handle = subscription as ReverbSubscription | undefined;

      if (!handle?.channel) {
        return;
      }

      client.leave(handle.channel);
    },
  };
}

/**
 * A no-op `LiveProvider` — subscribing does nothing and never emits
 * events. Useful for tests, storybook fixtures, and offline previews
 * where the realtime transport should stay dormant.
 */
export function createNoopLiveProvider(): RefineLiveProvider {
  return {
    subscribe(): undefined {
      return undefined;
    },
    unsubscribe(): void {
      // Nothing to tear down.
    },
  };
}
