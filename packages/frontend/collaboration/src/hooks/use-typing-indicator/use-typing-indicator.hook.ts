/**
 * @fileoverview useTypingIndicator hook — tracks typing state across room members.
 * @module @stackra/collaboration/hooks
 * @category Hooks
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useInject } from "@stackra/container/react";

import type { RoomMember } from "@/interfaces/room-member.interface";
import { RoomManager } from "@/services/room-manager.service";
import { COLLABORATION_EVENTS } from "@stackra/contracts";

/** Return type for the useTypingIndicator hook. */
interface UseTypingIndicatorReturn {
  /** Array of member names currently typing. */
  typingUsers: string[];

  /** Signal that the current user started typing. */
  startTyping: () => void;

  /** Signal that the current user stopped typing. */
  stopTyping: () => void;
}

/** Auto-expire typing indicator after this duration (ms). */
const TYPING_TIMEOUT_MS = 3000;

/**
 * React hook for tracking typing indicators across collaboration room members.
 *
 * Broadcasts typing state to the room and listens for typing events from
 * other members. Typing indicators auto-expire after 3 seconds of no
 * `startTyping()` call.
 *
 * @param roomId - The room to track typing in.
 * @returns Typing state and control functions.
 *
 * @example
 * ```tsx
 * function ChatInput() {
 *   const { typingUsers, startTyping, stopTyping } = useTypingIndicator('my-room');
 *
 *   return (
 *     <div>
 *       {typingUsers.length > 0 && (
 *         <p>{typingUsers.join(', ')} typing...</p>
 *       )}
 *       <input
 *         onFocus={startTyping}
 *         onBlur={stopTyping}
 *         onChange={startTyping}
 *       />
 *     </div>
 *   );
 * }
 * ```
 */
export function useTypingIndicator(roomId: string): UseTypingIndicatorReturn {
  const roomManager = useInject<RoomManager>(RoomManager);

  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const timeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    if (!roomManager) return;

    const transport = roomManager.getTransport();

    const unsubStart = transport.onBroadcast(
      roomId,
      COLLABORATION_EVENTS.TYPING_START,
      (_data: unknown, sender: RoomMember) => {
        setTypingUsers((prev) => {
          const set = new Set(prev);
          set.add(sender.name);
          return Array.from(set);
        });

        // Reset timeout for this user
        const existing = timeoutsRef.current.get(sender.userId);
        if (existing) clearTimeout(existing);

        timeoutsRef.current.set(
          sender.userId,
          setTimeout(() => {
            setTypingUsers((prev) => prev.filter((name) => name !== sender.name));
            timeoutsRef.current.delete(sender.userId);
          }, TYPING_TIMEOUT_MS),
        );
      },
    );

    const unsubStop = transport.onBroadcast(
      roomId,
      COLLABORATION_EVENTS.TYPING_STOP,
      (_data: unknown, sender: RoomMember) => {
        setTypingUsers((prev) => prev.filter((name) => name !== sender.name));
        const existing = timeoutsRef.current.get(sender.userId);
        if (existing) {
          clearTimeout(existing);
          timeoutsRef.current.delete(sender.userId);
        }
      },
    );

    const unsubLeave = transport.onMemberLeave(roomId, (member: RoomMember) => {
      setTypingUsers((prev) => prev.filter((name) => name !== member.name));
      const existing = timeoutsRef.current.get(member.userId);
      if (existing) {
        clearTimeout(existing);
        timeoutsRef.current.delete(member.userId);
      }
    });

    return () => {
      unsubStart();
      unsubStop();
      unsubLeave();
      timeoutsRef.current.forEach((t) => clearTimeout(t));
      timeoutsRef.current.clear();
      setTypingUsers([]);
    };
  }, [roomId, roomManager]);

  const startTyping = useCallback(() => {
    if (!roomManager) return;
    roomManager.getTransport().broadcast(roomId, COLLABORATION_EVENTS.TYPING_START, {});
  }, [roomId, roomManager]);

  const stopTyping = useCallback(() => {
    if (!roomManager) return;
    roomManager.getTransport().broadcast(roomId, COLLABORATION_EVENTS.TYPING_STOP, {});
  }, [roomId, roomManager]);

  return { typingUsers, startTyping, stopTyping };
}
