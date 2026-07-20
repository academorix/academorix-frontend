/**
 * @fileoverview useCursors hook — tracks cursor positions across room members.
 * @module @stackra/collaboration/hooks
 * @category Hooks
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useInject } from "@stackra/container/react";

import type { CursorPosition } from "@/interfaces/cursor-position.interface";
import type { RoomMember } from "@/interfaces/room-member.interface";
import { RoomManager } from "@/services/room-manager.service";
import { COLLABORATION_EVENTS } from "@stackra/contracts";

/** Return type for the useCursors hook. */
interface UseCursorsReturn {
  /** Map of userId → cursor position for all remote cursors. */
  cursors: Map<string, CursorPosition>;

  /** Update the local cursor position (throttled at 16ms). */
  updateCursor: (position: { x: number; y: number }) => void;
}

/** Throttle interval for cursor updates (≈60fps). */
const THROTTLE_MS = 16;

/**
 * React hook for tracking cursor positions across collaboration room members.
 *
 * Broadcasts the local cursor position (throttled at 16ms) and listens for
 * cursor updates from other members. Automatically removes cursors when
 * members leave the room.
 *
 * @param roomId - The room to track cursors in.
 * @returns Cursor state and update function.
 *
 * @example
 * ```tsx
 * function CursorOverlay() {
 *   const { cursors, updateCursor } = useCursors('my-room');
 *
 *   return (
 *     <div onPointerMove={(e) => updateCursor({ x: e.clientX, y: e.clientY })}>
 *       {Array.from(cursors.values()).map((cursor) => (
 *         <div
 *           key={cursor.userId}
 *           style={{ left: cursor.x, top: cursor.y, background: cursor.color }}
 *         />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useCursors(roomId: string): UseCursorsReturn {
  const roomManager = useInject<RoomManager>(RoomManager);

  const [cursors, setCursors] = useState<Map<string, CursorPosition>>(new Map());
  const lastBroadcastRef = useRef(0);

  useEffect(() => {
    if (!roomManager) return;

    const transport = roomManager.getTransport();

    const unsubCursor = transport.onBroadcast(
      roomId,
      COLLABORATION_EVENTS.CURSOR_MOVE,
      (data: unknown, sender: RoomMember) => {
        const pos = data as { x: number; y: number };
        setCursors((prev) => {
          const next = new Map(prev);
          next.set(sender.userId, {
            x: pos.x,
            y: pos.y,
            userId: sender.userId,
            name: sender.name,
            color: sender.color,
          });
          return next;
        });
      },
    );

    const unsubRemove = transport.onBroadcast(
      roomId,
      COLLABORATION_EVENTS.CURSOR_REMOVE,
      (data: unknown) => {
        const { userId } = data as { userId: string };
        setCursors((prev) => {
          const next = new Map(prev);
          next.delete(userId);
          return next;
        });
      },
    );

    const unsubLeave = transport.onMemberLeave(roomId, (member: RoomMember) => {
      setCursors((prev) => {
        const next = new Map(prev);
        next.delete(member.userId);
        return next;
      });
    });

    return () => {
      unsubCursor();
      unsubRemove();
      unsubLeave();
      setCursors(new Map());
    };
  }, [roomId, roomManager]);

  const updateCursor = useCallback(
    (position: { x: number; y: number }) => {
      if (!roomManager) return;

      const now = Date.now();
      if (now - lastBroadcastRef.current < THROTTLE_MS) return;
      lastBroadcastRef.current = now;

      roomManager.getTransport().broadcast(roomId, COLLABORATION_EVENTS.CURSOR_MOVE, position);
    },
    [roomId, roomManager],
  );

  return { cursors, updateCursor };
}
