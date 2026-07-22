/**
 * @file use-devtools-frame-state.hook.ts
 * @module @stackra/devtools/react/hooks
 * @description Subscribe to the persisted frame state (open, active
 *   panel id, position, size, inspector toggle, search query).
 *
 *   The `update` callback flushes through the frame-state service
 *   so both in-memory state and (optionally) the persisted storage
 *   update in one call.
 */

import { useCallback, useSyncExternalStore } from "react";

import type { IDevtoolsFrameState } from "@/core/interfaces";
import { useDevtoolsContext } from "../use-devtools-context";

/** Result returned by {@link useDevtoolsFrameState}. */
export interface IUseDevtoolsFrameStateResult {
  /** Current frame state. */
  readonly state: IDevtoolsFrameState;
  /** Update one or more fields, persist, and notify subscribers. */
  readonly update: (partial: Partial<IDevtoolsFrameState>) => void;
}

/**
 * Read + update the persisted frame state.
 */
export function useDevtoolsFrameState(): IUseDevtoolsFrameStateResult {
  const { frameState } = useDevtoolsContext();

  const subscribe = useCallback(
    (listener: () => void) => frameState.subscribe(listener),
    [frameState],
  );
  const getSnapshot = useCallback(() => frameState.getSnapshot(), [frameState]);
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const update = useCallback(
    (partial: Partial<IDevtoolsFrameState>) => {
      frameState.update(partial);
    },
    [frameState],
  );

  return { state, update };
}
