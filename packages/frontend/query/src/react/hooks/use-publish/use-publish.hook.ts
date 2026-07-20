/**
 * @file use-publish.hook.ts
 * @module @stackra/query/react/hooks/use-publish
 * @description Client-side publish for `ILiveEvent` payloads.
 *
 *   Under the hood: resolves `REALTIME_MANAGER`, opens the target
 *   connection + channel, and calls `channel.whisper(type, payload)`
 *   — the client-event path that dispatches to peers in the same
 *   channel without touching the server. Useful when a mutation
 *   succeeds and the app wants to nudge other tabs / other users to
 *   invalidate their queries even though the server hasn't yet
 *   broadcast the change itself.
 *
 *   Server-authoritative apps typically DON'T need this — the
 *   server's own broadcast on write is the source of truth and
 *   fires `liveMode: 'auto'` refetches everywhere. `usePublish` is
 *   the escape hatch for peer-to-peer / optimistic-only workflows.
 *
 *   Fail-soft: returns a no-op when `@stackra/realtime` isn't
 *   installed.
 */

import { useCallback } from "react";
import { useOptionalInject } from "@stackra/container/react";
import { REALTIME_MANAGER, type ILiveEvent, type IRealtimeManager } from "@stackra/contracts";

/**
 * Publish function signature returned by `usePublish`.
 *
 * The `date` field on `ILiveEvent` is optional in the input shape —
 * the hook fills it with `new Date()` when the caller omits it.
 */
export type PublishLiveEvent = (
  event: Omit<ILiveEvent, "date"> & { readonly date?: Date },
) => Promise<void>;

/**
 * Options accepted by `usePublish`.
 */
export interface UsePublishOptions {
  /**
   * Named realtime connection. Defaults to the manager's default.
   */
  connection?: string;
  /**
   * Whether to open a private channel. @default false
   */
  private?: boolean;
}

/**
 * Return a publish function bound to a named realtime connection.
 *
 * @example
 * ```typescript
 * const publish = usePublish();
 * await publish({
 *   channel: 'themes',
 *   type: 'updated',
 *   payload: { ids: [themeId] },
 * });
 * ```
 */
export function usePublish(options: UsePublishOptions = {}): PublishLiveEvent {
  const manager = useOptionalInject<IRealtimeManager>(REALTIME_MANAGER);

  const { connection: connectionName, private: isPrivate = false } = options;

  return useCallback<PublishLiveEvent>(
    async (event) => {
      if (!manager) return; // fail-soft: realtime peer absent → no-op
      const conn = await manager.connection(connectionName);
      const channel = isPrivate ? conn.privateChannel(event.channel) : conn.channel(event.channel);
      // `whisper` is the client-event dispatch — it broadcasts to
      // peers in the same channel without contacting the server.
      channel.whisper(event.type, {
        ...event.payload,
        // Include timestamp in the whispered payload so receivers
        // that fabricate an `ILiveEvent` on their side have a
        // consistent shape.
        __stackraQueryEventDate: (event.date ?? new Date()).toISOString(),
      });
    },
    [manager, connectionName, isPrivate],
  );
}
