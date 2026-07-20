/**
 * @file use-action-dispatcher.hook.ts
 * @module @stackra/actions/core/hooks/use-action-dispatcher
 * @description `useActionDispatcher()` — resolves the DI-managed action
 *   dispatcher and returns a stable bound callback that dispatches a
 *   descriptor through the pipeline.
 *
 *   Cross-platform: uses only `useInject` from `@stackra/container/react`
 *   plus a `useCallback`, so it works on web (via `@stackra/actions/react`)
 *   AND React Native (via `@stackra/actions/native`) without a DOM
 *   assumption.
 */

import { useCallback } from "react";
import { useInject } from "@stackra/container/react";
import type {
  IActionContext,
  IActionDescriptor,
  IActionDispatcher,
  IActionResponse,
} from "@stackra/contracts";
import { ACTION_DISPATCHER } from "@stackra/contracts";

/**
 * Signature of the stable dispatch callback returned by
 * {@link useActionDispatcher}.
 */
export type ActionDispatchCallback = <D extends IActionDescriptor, R = unknown>(
  descriptor: D,
  context?: IActionContext,
) => Promise<IActionResponse<R>>;

/**
 * Resolve the framework `ACTION_DISPATCHER` and return a stable bound
 * callback that dispatches a descriptor through the middleware pipeline.
 *
 * The callback is memoized against the dispatcher instance — it stays
 * referentially stable across re-renders unless the container itself
 * changes (which does not happen in normal use).
 *
 * @returns A stable `dispatch(descriptor, context?)` function.
 *
 * @throws When called outside a `<ContainerProvider>` or when
 * `ACTION_DISPATCHER` is not bound in the container.
 *
 * @example
 * ```tsx
 * import { useActionDispatcher } from '@stackra/actions/react';
 *
 * function SaveButton() {
 *   const dispatch = useActionDispatcher();
 *   return (
 *     <Button onPress={() => dispatch({ kind: 'toast', message: 'Saved' })}>
 *       Save
 *     </Button>
 *   );
 * }
 * ```
 */
export function useActionDispatcher(): ActionDispatchCallback {
  const dispatcher = useInject<IActionDispatcher>(ACTION_DISPATCHER);
  return useCallback(
    <D extends IActionDescriptor, R = unknown>(descriptor: D, context?: IActionContext) =>
      dispatcher.dispatch<D, R>(descriptor, context),
    [dispatcher],
  );
}
