/**
 * @fileoverview useActivityFeed hook — timeline of room events.
 * @module @stackra/collaboration/hooks
 * @category Hooks
 */

import { useState, useEffect, useCallback } from "react";
import { useInject } from "@stackra/container/react";
import { Str } from "@stackra/support";

import type { ActivityEntry } from "@/types/activity-entry.type";
import type { RoomMember } from "@/interfaces/room-member.interface";
import { RoomManager } from "@/services/room-manager.service";
import { COLLABORATION_EVENTS } from "@stackra/contracts";

/** Maximum number of activity entries to keep in memory. */
const MAX_ENTRIES = 50;

/** Return type for the useActivityFeed hook. */
interface UseActivityFeedReturn {
  /** Activity entries (newest first). */
  activities: ActivityEntry[];

  /** Whether the feed is still loading initial data. */
  isLoading: boolean;

  /** Manually add an activity entry. */
  addActivity: (entry: Omit<ActivityEntry, "id" | "timestamp">) => void;
}

/**
 * React hook for tracking a timeline of room events.
 *
 * Auto-populates from room events (joins, leaves, state changes, messages).
 * Keeps the last 50 entries in memory.
 *
 * @param roomId - The room to track activity for.
 * @returns Activity feed state.
 *
 * @example
 * ```tsx
 * function ActivityTimeline() {
 *   const { activities, isLoading } = useActivityFeed('my-room');
 *
 *   if (isLoading) return <p>Loading...</p>;
 *
 *   return (
 *     <ul>
 *       {activities.map((entry) => (
 *         <li key={entry.id}>
 *           <span>{entry.userName}</span>: {entry.message}
 *         </li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export function useActivityFeed(roomId: string): UseActivityFeedReturn {
  const roomManager = useInject<RoomManager>(RoomManager);

  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const pushEntry = useCallback((entry: Omit<ActivityEntry, "id" | "timestamp">) => {
    const full: ActivityEntry = {
      ...entry,
      // `Str.uuid()` per the workspace support-utilities policy.
      id: Str.uuid(),
      timestamp: Date.now(),
    };
    setActivities((prev) => [full, ...prev].slice(0, MAX_ENTRIES));
  }, []);

  useEffect(() => {
    if (!roomManager) return;

    const transport = roomManager.getTransport();
    setIsLoading(false);

    const unsubJoin = transport.onMemberJoin(roomId, (member: RoomMember) => {
      pushEntry({
        type: "join",
        userId: member.userId,
        userName: member.name,
        message: `${member.name} joined the room`,
      });
    });

    const unsubLeave = transport.onMemberLeave(roomId, (member: RoomMember) => {
      pushEntry({
        type: "leave",
        userId: member.userId,
        userName: member.name,
        message: `${member.name} left the room`,
      });
    });

    const unsubState = transport.onStateChange(roomId, (_state: unknown, updatedBy: RoomMember) => {
      pushEntry({
        type: "state_change",
        userId: updatedBy.userId,
        userName: updatedBy.name,
        message: `${updatedBy.name} updated the shared state`,
      });
    });

    const unsubThread = transport.onBroadcast(
      roomId,
      COLLABORATION_EVENTS.THREAD_CREATE,
      (_data: unknown, sender: RoomMember) => {
        pushEntry({
          type: "thread_create",
          userId: sender.userId,
          userName: sender.name,
          message: `${sender.name} started a new thread`,
        });
      },
    );

    const unsubResolve = transport.onBroadcast(
      roomId,
      COLLABORATION_EVENTS.THREAD_RESOLVE,
      (_data: unknown, sender: RoomMember) => {
        pushEntry({
          type: "thread_resolve",
          userId: sender.userId,
          userName: sender.name,
          message: `${sender.name} resolved a thread`,
        });
      },
    );

    return () => {
      unsubJoin();
      unsubLeave();
      unsubState();
      unsubThread();
      unsubResolve();
    };
  }, [roomId, roomManager, pushEntry]);

  return { activities, isLoading, addActivity: pushEntry };
}
