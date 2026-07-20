/**
 * @fileoverview useThreads hook — manages discussion threads in a room.
 * @module @stackra/collaboration/hooks
 * @category Hooks
 */

import { useState, useEffect, useCallback } from 'react';
import { useInject } from '@stackra/container/react';
import { Str } from '@stackra/support';

import type { Thread, ThreadMessage } from '@/interfaces/thread.interface';
import { RoomManager } from '@/services/room-manager.service';
import { COLLABORATION_EVENTS } from '@stackra/contracts';

/** Return type for the useThreads hook. */
interface UseThreadsReturn {
  /** All threads in the room. */
  threads: Thread[];

  /** Create a new thread. */
  createThread: (body: string, elementId?: string) => void;

  /** Reply to an existing thread. */
  reply: (threadId: string, body: string) => void;

  /** Mark a thread as resolved. */
  resolve: (threadId: string) => void;

  /** Delete a thread. */
  deleteThread: (threadId: string) => void;
}

/**
 * React hook for managing discussion threads in a collaboration room.
 *
 * Threads are synchronized across all room members via broadcast events.
 * Each thread has messages, resolution status, and optional element anchoring.
 *
 * @param roomId - The room to manage threads in.
 * @param selfUserId - The current user's ID.
 * @param selfUserName - The current user's display name.
 * @returns Thread state and CRUD actions.
 *
 * @example
 * ```tsx
 * function ThreadPanel() {
 *   const { threads, createThread, reply, resolve } = useThreads(
 *     'my-room',
 *     'user-abc',
 *     'Alice',
 *   );
 *
 *   return (
 *     <div>
 *       <button onClick={() => createThread('New discussion')}>
 *         New Thread
 *       </button>
 *       {threads.map((thread) => (
 *         <div key={thread.id}>
 *           <p>{thread.messages[0]?.body}</p>
 *           <button onClick={() => resolve(thread.id)}>Resolve</button>
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useThreads(
  roomId: string,
  selfUserId: string,
  selfUserName: string
): UseThreadsReturn {
  const roomManager = useInject<RoomManager>(RoomManager);

  const [threads, setThreads] = useState<Thread[]>([]);

  useEffect(() => {
    if (!roomManager) return;

    const transport = roomManager.getTransport();

    const unsubCreate = transport.onBroadcast(
      roomId,
      COLLABORATION_EVENTS.THREAD_CREATE,
      (data: unknown) => {
        const thread = data as Thread;
        setThreads((prev) => [...prev, thread]);
      }
    );

    const unsubReply = transport.onBroadcast(
      roomId,
      COLLABORATION_EVENTS.THREAD_REPLY,
      (data: unknown) => {
        const { threadId, message } = data as { threadId: string; message: ThreadMessage };
        setThreads((prev) =>
          prev.map((t) => (t.id === threadId ? { ...t, messages: [...t.messages, message] } : t))
        );
      }
    );

    const unsubResolve = transport.onBroadcast(
      roomId,
      COLLABORATION_EVENTS.THREAD_RESOLVE,
      (data: unknown) => {
        const { threadId } = data as { threadId: string };
        setThreads((prev) => prev.map((t) => (t.id === threadId ? { ...t, resolved: true } : t)));
      }
    );

    const unsubDelete = transport.onBroadcast(
      roomId,
      COLLABORATION_EVENTS.THREAD_DELETE,
      (data: unknown) => {
        const { threadId } = data as { threadId: string };
        setThreads((prev) => prev.filter((t) => t.id !== threadId));
      }
    );

    return () => {
      unsubCreate();
      unsubReply();
      unsubResolve();
      unsubDelete();
    };
  }, [roomId, roomManager]);

  const createThread = useCallback(
    (body: string, elementId?: string) => {
      if (!roomManager) return;

      const thread: Thread = {
        // `Str.uuid()` per the workspace support-utilities policy —
        // replaces the previous `Math.random().toString(36).slice(2, 10)`
        // which is not cryptographically stable and can collide.
        id: Str.uuid(),
        roomId,
        elementId,
        messages: [
          {
            id: Str.uuid(),
            body,
            createdBy: selfUserId,
            createdByName: selfUserName,
            createdAt: Date.now(),
          },
        ],
        resolved: false,
        createdBy: selfUserId,
        createdByName: selfUserName,
        createdAt: Date.now(),
      };

      setThreads((prev) => [...prev, thread]);
      roomManager.getTransport().broadcast(roomId, COLLABORATION_EVENTS.THREAD_CREATE, thread);
    },
    [roomId, roomManager, selfUserId, selfUserName]
  );

  const reply = useCallback(
    (threadId: string, body: string) => {
      if (!roomManager) return;

      const message: ThreadMessage = {
        id: Str.uuid(),
        body,
        createdBy: selfUserId,
        createdByName: selfUserName,
        createdAt: Date.now(),
      };

      setThreads((prev) =>
        prev.map((t) => (t.id === threadId ? { ...t, messages: [...t.messages, message] } : t))
      );

      roomManager
        .getTransport()
        .broadcast(roomId, COLLABORATION_EVENTS.THREAD_REPLY, { threadId, message });
    },
    [roomId, roomManager, selfUserId, selfUserName]
  );

  const resolve = useCallback(
    (threadId: string) => {
      if (!roomManager) return;

      setThreads((prev) => prev.map((t) => (t.id === threadId ? { ...t, resolved: true } : t)));

      roomManager
        .getTransport()
        .broadcast(roomId, COLLABORATION_EVENTS.THREAD_RESOLVE, { threadId });
    },
    [roomId, roomManager]
  );

  const deleteThread = useCallback(
    (threadId: string) => {
      if (!roomManager) return;

      setThreads((prev) => prev.filter((t) => t.id !== threadId));

      roomManager
        .getTransport()
        .broadcast(roomId, COLLABORATION_EVENTS.THREAD_DELETE, { threadId });
    },
    [roomId, roomManager]
  );

  return { threads, createThread, reply, resolve, deleteThread };
}
