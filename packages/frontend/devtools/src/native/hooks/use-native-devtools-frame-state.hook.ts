/**
 * @file use-native-devtools-frame-state.hook.ts
 * @module @stackra/devtools/native/hooks
 * @description Native mirror of `useDevtoolsFrameState`.
 */

import { useCallback, useSyncExternalStore } from 'react';
import { useInject } from '@stackra/container/react';

import type { IDevtoolsFrameState } from '@/core/interfaces';
import { DevtoolsFrameStateService } from '@/core/services';

/** Result returned by {@link useNativeDevtoolsFrameState}. */
export interface IUseNativeDevtoolsFrameStateResult {
  /** Current frame state. */
  readonly state: IDevtoolsFrameState;
  /** Update fields + persist + notify. */
  readonly update: (partial: Partial<IDevtoolsFrameState>) => void;
}

/**
 * Native frame-state hook. Same contract as the web equivalent.
 */
export function useNativeDevtoolsFrameState(): IUseNativeDevtoolsFrameStateResult {
  const frameState = useInject(DevtoolsFrameStateService);
  const subscribe = useCallback(
    (listener: () => void) => frameState.subscribe(listener),
    [frameState]
  );
  const getSnapshot = useCallback(() => frameState.getSnapshot(), [frameState]);
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const update = useCallback(
    (partial: Partial<IDevtoolsFrameState>) => frameState.update(partial),
    [frameState]
  );
  return { state, update };
}
