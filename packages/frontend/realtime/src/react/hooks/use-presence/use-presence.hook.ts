/**
 * @file use-presence.hook.ts
 * @module @stackra/realtime/react
 * @description React hook for subscribing to a presence channel.
 *   Returns reactive members list, joining, and leaving callbacks.
 */

import { useState, useEffect, useRef } from "react";
import { useInject } from "@stackra/container/react";
import { REALTIME_MANAGER } from "@stackra/contracts";
import { RealtimeManager } from "@/core/services/realtime-manager.service";
import type { IRealtimePresenceChannel } from "@/core/interfaces/realtime-connection.interface";

// ════════════════════════════════════════════════════════════════════════════════
// Types
// ════════════════════════════════════════════════════════════════════════════════

/** Return value of {@link usePresence}. */
export interface UsePresenceResult {
  /** Members currently present in the channel. Shape is driver-specific. */
  members: unknown[];
  /** Whether the underlying presence channel has been bound. */
  connected: boolean;
}

// ════════════════════════════════════════════════════════════════════════════════
// Hook
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Subscribe to a presence channel and track members.
 *
 * @param channelName - The presence channel name to subscribe to
 * @returns Reactive presence state with current members
 *
 * @example
 * ```typescript
 * function OnlineUsers({ roomId }: Props) {
 *   const { members, connected } = usePresence(`room.${roomId}`);
 *
 *   if (!connected) return <Spinner />;
 *   return (
 *     <ul>
 *       {members.map((m: any) => <li key={m.id}>{m.name}</li>)}
 *     </ul>
 *   );
 * }
 * ```
 */
export function usePresence(channelName: string): UsePresenceResult {
  const manager = useInject<RealtimeManager>(REALTIME_MANAGER);
  const [members, setMembers] = useState<unknown[]>([]);
  const [connected, setConnected] = useState(false);
  const channelRef = useRef<IRealtimePresenceChannel | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const conn = await manager.connection();
        if (cancelled) return;
        const channel = conn.presenceChannel(channelName);
        channelRef.current = channel;
        setConnected(true);

        channel.here((m: unknown[]) => {
          if (!cancelled) setMembers(m);
        });
        channel.joining((m: unknown) => {
          if (!cancelled) setMembers((prev) => [...prev, m]);
        });
        channel.leaving((m: unknown) => {
          if (!cancelled) setMembers((prev) => prev.filter((p) => p !== m));
        });
      } catch {
        // Connection not available
      }
    })();

    return () => {
      cancelled = true;
      channelRef.current?.leave();
      channelRef.current = null;
      setConnected(false);
    };
  }, [manager, channelName]);

  return { members, connected };
}
