/**
 * @fileoverview useSharedState hook — synchronized state across room members.
 * @module @stackra/collaboration/hooks
 * @category Hooks
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useInject } from '@stackra/container/react';

import type { RoomMember } from '@/interfaces/room-member.interface';
import { RoomManager } from '@/services/room-manager.service';

/** Metadata about the shared state. */
interface SharedStateMeta {
  /** The member who last updated the state (null if self). */
  lastUpdatedBy: RoomMember | null;

  /** Monotonically increasing version counter. */
  version: number;
}

/** Return type for the useSharedState hook. */
type UseSharedStateReturn<T> = [
  /** Current shared state value. */
  state: T,
  /** Update the shared state (broadcasts to all members). */
  setState: (updater: T | ((prev: T) => T)) => void,
  /** Metadata about the state. */
  meta: SharedStateMeta,
];

/**
 * React hook for synchronized shared state across collaboration room members.
 *
 * Uses last-write-wins conflict resolution. State updates are broadcast to
 * all room members and incoming updates trigger re-renders. Includes a
 * version counter for optimistic UI patterns.
 *
 * @typeParam T - The shape of the shared state.
 * @param roomId - The room to share state in.
 * @param initialState - The initial state value.
 * @returns A tuple of [state, setState, meta].
 *
 * @example
 * ```tsx
 * function SharedCounter() {
 *   const [count, setCount, { lastUpdatedBy, version }] = useSharedState<number>(
 *     'my-room',
 *     0,
 *   );
 *
 *   return (
 *     <div>
 *       <p>Count: {count} (v{version})</p>
 *       <button onClick={() => setCount((prev) => prev + 1)}>+1</button>
 *       {lastUpdatedBy && <p>Last updated by: {lastUpdatedBy.name}</p>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useSharedState<T>(roomId: string, initialState: T): UseSharedStateReturn<T> {
  const roomManager = useInject<RoomManager>(RoomManager);

  const [state, setLocalState] = useState<T>(initialState);
  const [meta, setMeta] = useState<SharedStateMeta>({
    lastUpdatedBy: null,
    version: 0,
  });
  const versionRef = useRef(0);

  useEffect(() => {
    if (!roomManager) return;

    const transport = roomManager.getTransport();

    // Initialize from transport state if available
    const existing = transport.getState<T>(roomId);
    if (existing !== null) {
      setLocalState(existing);
    }

    const unsub = transport.onStateChange<T>(roomId, (newState, updatedBy) => {
      versionRef.current += 1;
      setLocalState(newState);
      setMeta({
        lastUpdatedBy: updatedBy,
        version: versionRef.current,
      });
    });

    return () => {
      unsub();
    };
  }, [roomId, roomManager]);

  const setState = useCallback(
    (updater: T | ((prev: T) => T)) => {
      if (!roomManager) return;

      const transport = roomManager.getTransport();

      setLocalState((prev) => {
        const next = typeof updater === 'function' ? (updater as (prev: T) => T)(prev) : updater;

        // Broadcast to other members
        transport.setState<T>(roomId, () => next);

        versionRef.current += 1;
        setMeta({
          lastUpdatedBy: null,
          version: versionRef.current,
        });

        return next;
      });
    },
    [roomId, roomManager]
  );

  return [state, setState, meta];
}
