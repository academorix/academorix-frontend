/**
 * @file use-action.hook.ts
 * @module @stackra/actions/core/hooks/use-action
 * @description `useAction(kind)` — a stateful React hook bound to a
 *   single action `kind`.
 *
 *   Layers reactive state (`isPending`, `response`, `data`, `error`) on
 *   top of {@link useActionDispatcher} so a call site can render a
 *   pending indicator or a follow-up notification without hand-managing
 *   a `useState` triple.
 *
 *   Cross-platform: no DOM assumptions. Both `@stackra/actions/react`
 *   and `@stackra/actions/native` re-export this hook.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { IActionContext, IActionDescriptor, IActionResponse } from "@stackra/contracts";

import { useActionDispatcher } from "../use-action-dispatcher";
import type { IUseActionResult, IUseActionState } from "./use-action.interface";

/**
 * Initial state used by the reducer inside {@link useAction} and by
 * `reset()`. Frozen so tests can compare-by-reference.
 */
const INITIAL_STATE: IUseActionState<unknown> = Object.freeze({
  isPending: false,
  response: null,
  data: null,
  error: null,
});

/**
 * `useAction<D, R>(kind)` — hook wiring a specific action `kind` to
 * reactive state.
 *
 * ### Behavior
 *
 * - `run(descriptor, context?)` sets `isPending = true`, dispatches
 *   through {@link useActionDispatcher}, and stores the resolved
 *   response. Multiple concurrent `run()` invocations are serialized by
 *   a monotonic generation number so a stale response never overwrites
 *   a fresher one.
 * - On unmount, any late-arriving response is discarded (via a mounted
 *   ref) so the hook never writes to state after the component tree is
 *   gone. React 18+ handles this gracefully, but the guard keeps
 *   Vitest/StrictMode double-mount output clean.
 * - The `kind` argument is currently informational — it is not
 *   validated against `descriptor.kind` in `run()` because a caller may
 *   want to dispatch a `Composite` descriptor from a hook bound to
 *   another kind (rare, but valid).
 *
 * @typeParam D - Descriptor variant this hook is bound to.
 * @typeParam R - Response data payload type.
 * @param kind - The `ActionKind` this hook is nominally associated with.
 * @returns A stable {@link IUseActionResult}.
 *
 * @example
 * ```tsx
 * import { useAction } from '@stackra/actions/react';
 *
 * function SaveButton() {
 *   const { run, isPending, error } = useAction<IToastAction>('toast');
 *   return (
 *     <Button
 *       isPending={isPending}
 *       onPress={() => run({ kind: 'toast', message: 'Saved' })}
 *     >
 *       {error ?? 'Save'}
 *     </Button>
 *   );
 * }
 * ```
 */
export function useAction<D extends IActionDescriptor = IActionDescriptor, R = unknown>(
  _kind: D["kind"],
): IUseActionResult<D, R> {
  const dispatch = useActionDispatcher();

  // Reactive state. Kept as a single object so consumers receive a
  // stable snapshot per render pass instead of interleaved partials.
  const [state, setState] = useState<IUseActionState<R>>(INITIAL_STATE as IUseActionState<R>);

  // Mounted guard — flipped to `false` in the effect's cleanup so the
  // finalizer inside `run()` skips its `setState` after teardown.
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Monotonic generation. `run()` captures the current value on entry;
  // only the freshest generation is allowed to write terminal state, so
  // an earlier slower dispatch cannot overwrite a later faster one.
  const genRef = useRef(0);

  const run = useCallback(
    async (descriptor: D, context?: IActionContext): Promise<IActionResponse<R>> => {
      const gen = ++genRef.current;

      // Optimistically mark pending — always safe because the state is
      // guarded by `mountedRef` on the trailing edge.
      if (mountedRef.current) {
        setState((prev) => ({ ...prev, isPending: true, error: null }));
      }

      const response = await dispatch<D, R>(descriptor, context);

      // Ignore stale writes: only the freshest `run()` may commit state.
      if (!mountedRef.current || gen !== genRef.current) return response;

      const nextState: IUseActionState<R> = response.success
        ? {
            isPending: false,
            response,
            data: (response.data ?? null) as R | null,
            error: null,
          }
        : {
            isPending: false,
            response,
            data: null,
            error: response.message ?? "Action failed",
          };
      setState(nextState);
      return response;
    },
    [dispatch],
  );

  const reset = useCallback(() => {
    // Bump the generation so any in-flight `run()` becomes stale and
    // won't commit its terminal state after this reset.
    ++genRef.current;
    if (mountedRef.current) setState(INITIAL_STATE as IUseActionState<R>);
  }, []);

  return {
    isPending: state.isPending,
    response: state.response,
    data: state.data,
    error: state.error,
    run,
    reset,
  };
}
