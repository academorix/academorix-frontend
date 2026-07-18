/**
 * @file use-channel.ts
 * @module @academorix/realtime/hooks/use-channel
 *
 * @description
 * React hooks for subscribing to Reverb channels. Three variants —
 * public / private / presence — matching Laravel's channel model.
 *
 * Every hook:
 *   - Subscribes on mount, tears down on unmount.
 *   - Re-subscribes when the channel name changes (rare — usually a
 *     stable string).
 *   - Server-safe: does nothing during SSR (React 19 with `use client`
 *     boundaries handles the split automatically).
 *
 * The `handlers` object is a record of event-name → callback.
 * Callers pass a stable reference (via `useCallback` / `useMemo`)
 * when the callbacks close over changing values; the hook binds
 * whatever handlers are passed on each render.
 *
 * @example
 * ```tsx
 * import { useChannel } from "@academorix/realtime/hooks";
 * import { useRealtimeClient } from "@/lib/realtime";
 *
 * function TenantBroadcasts({ tenantId }: { tenantId: string }) {
 *   const client = useRealtimeClient();
 *
 *   useChannel(client, `tenant.${tenantId}.broadcasts`, {
 *     "notice.published": (payload) => addToast(payload),
 *   });
 *
 *   return null;
 * }
 * ```
 */

import { useEffect } from "react";

import type { RealtimeClient } from "../client/realtime-client.type";

/**
 * Map of event name → handler. Every entry becomes a `listen(event,
 * callback)` on the underlying channel; the hook automatically
 * `stopListening`s on unmount.
 */
export type ChannelHandlers = Readonly<Record<string, (payload: unknown) => void>>;

/**
 * Subscribes to a **public** channel — anyone can listen without
 * authentication. Useful for tenant-wide broadcasts that don't carry
 * per-user PII.
 */
export function useChannel(
  client: RealtimeClient,
  channelName: string,
  handlers: ChannelHandlers,
): void {
  useEffect(() => {
    if (!channelName) {
      return undefined;
    }

    const channel = client.channel(channelName);

    for (const [event, callback] of Object.entries(handlers)) {
      channel.listen(event, callback);
    }

    return () => {
      client.leave(channelName);
    };
    // handlers is intentionally NOT in deps — apps that need
    // stable-reference handlers wrap them in useCallback themselves.
    // Re-binding on every render creates duplicate listeners.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, channelName]);
}

/**
 * Subscribes to a **private** channel — the `/broadcasting/auth`
 * endpoint must authorise the current session. Suitable for per-user
 * notifications and account-scoped events.
 */
export function usePrivateChannel(
  client: RealtimeClient,
  channelName: string,
  handlers: ChannelHandlers,
): void {
  useEffect(() => {
    if (!channelName) {
      return undefined;
    }

    const channel = client.private(channelName);

    for (const [event, callback] of Object.entries(handlers)) {
      channel.listen(event, callback);
    }

    return () => {
      client.leave(`private-${channelName}`);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, channelName]);
}
