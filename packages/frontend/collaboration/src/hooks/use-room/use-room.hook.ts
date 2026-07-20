/**
 * @fileoverview useRoom hook — manages room connection lifecycle.
 * @module @stackra/collaboration/hooks
 * @category Hooks
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useInject } from "@stackra/container/react";
import { Str } from "@stackra/support";

import type { RoomMember } from "@/interfaces/room-member.interface";
import type { RoomOptions } from "@/interfaces/room-options.interface";
import { RoomManager } from "@/services/room-manager.service";

/** Color palette for auto-assigning user colors. */
const COLOR_PALETTE = [
  "#e74c3c",
  "#3498db",
  "#2ecc71",
  "#f39c12",
  "#9b59b6",
  "#1abc9c",
  "#e67e22",
  "#34495e",
  "#16a085",
  "#c0392b",
  "#2980b9",
  "#8e44ad",
  "#27ae60",
  "#d35400",
  "#7f8c8d",
];

/** Connection status for the room. */
type RoomStatus = "connecting" | "connected" | "disconnected" | "error";

/** Return type for the useRoom hook. */
interface UseRoomReturn {
  /** All members currently in the room (excluding self). */
  members: RoomMember[];

  /** The current user's member object. */
  self: RoomMember | null;

  /** Current connection status. */
  status: RoomStatus;

  /** Broadcast an ephemeral event to the room. */
  broadcast: (event: string, data: unknown) => void;

  /** Manually leave the room. */
  leave: () => void;
}

/**
 * React hook for managing collaboration room connections.
 *
 * Auto-connects on mount and disconnects on unmount. Tracks all members
 * with their presence data and provides broadcast capabilities.
 *
 * @param roomId - The room to connect to.
 * @param options - Optional room configuration.
 * @returns Room state including members, self, status, and actions.
 *
 * @example
 * ```tsx
 * function CollabRoom() {
 *   const { members, self, status, broadcast, leave } = useRoom('my-room', {
 *     userName: 'Alice',
 *   });
 *
 *   return (
 *     <div>
 *       <p>Status: {status}</p>
 *       <p>Members: {members.length}</p>
 *       <button onClick={() => broadcast('ping', { time: Date.now() })}>
 *         Ping
 *       </button>
 *       <button onClick={leave}>Leave</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useRoom(roomId: string, options?: RoomOptions): UseRoomReturn {
  const roomManager = useInject<RoomManager>(RoomManager);

  const [members, setMembers] = useState<RoomMember[]>([]);
  const [self, setSelf] = useState<RoomMember | null>(null);
  const [status, setStatus] = useState<RoomStatus>("disconnected");
  const connectedRef = useRef(false);

  // Generate stable user identity per tab. `Str.uuid()` replaces the
  // previous `Math.random().toString(36).slice(2, 8)` id-gen per the
  // support-utilities policy. Color picking still uses `Math.random`
  // because it's a random-choice-from-palette use case, not id-gen.
  const userIdRef = useRef(options?.userId ?? Str.uuid());
  const userColorRef = useRef(
    options?.userColor ??
      COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)] ??
      "#3498db",
  );
  const userNameRef = useRef(options?.userName ?? `User-${userIdRef.current}`);

  useEffect(() => {
    if (!roomManager) return;

    const transport = roomManager.getTransport();
    const userId = userIdRef.current;
    const userName = userNameRef.current;
    const userColor = userColorRef.current;

    const selfMember: RoomMember = {
      userId,
      name: userName,
      color: userColor,
      joinedAt: Date.now(),
      presence: options?.initialPresence ?? {},
    };

    setSelf(selfMember);
    setStatus("connecting");

    transport
      .connect(roomId, userId, { name: userName, color: userColor, ...options?.initialPresence })
      .then(() => {
        connectedRef.current = true;
        setStatus("connected");
      })
      .catch(() => {
        setStatus("error");
      });

    const unsubJoin = transport.onMemberJoin(roomId, (member) => {
      setMembers((prev) => {
        const filtered = prev.filter((m) => m.userId !== member.userId);
        return [...filtered, member];
      });
    });

    const unsubLeave = transport.onMemberLeave(roomId, (member) => {
      setMembers((prev) => prev.filter((m) => m.userId !== member.userId));
    });

    return () => {
      unsubJoin();
      unsubLeave();
      if (connectedRef.current) {
        transport.disconnect(roomId);
        connectedRef.current = false;
      }
      setStatus("disconnected");
      setMembers([]);
    };
  }, [roomId, roomManager]);

  const broadcast = useCallback(
    (event: string, data: unknown) => {
      if (!roomManager) return;
      roomManager.getTransport().broadcast(roomId, event, data);
    },
    [roomId, roomManager],
  );

  const leave = useCallback(() => {
    if (!roomManager) return;
    if (connectedRef.current) {
      roomManager.getTransport().disconnect(roomId);
      connectedRef.current = false;
      setStatus("disconnected");
      setMembers([]);
    }
  }, [roomId, roomManager]);

  return { members, self, status, broadcast, leave };
}
