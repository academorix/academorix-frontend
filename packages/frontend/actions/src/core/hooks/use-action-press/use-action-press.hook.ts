/**
 * @file use-action-press.hook.ts
 * @module @stackra/actions/core/hooks/use-action-press
 * @description `useActionPress(descriptor, options?)` — bind a single
 *   descriptor to an `onPress` handler for HeroUI/RN pressables.
 */

import { useCallback } from "react";
import type { IActionDescriptor, IActionResponse } from "@stackra/contracts";

import { useAction } from "../use-action";
import type { IUseActionPressOptions, IUseActionPressResult } from "./use-action-press.interface";

/**
 * Bind a single descriptor to a stable `onPress` handler suitable for
 * HeroUI's `Button.onPress` or React Native's `Pressable.onPress`.
 *
 * Under the hood, the hook composes {@link useAction} with the
 * descriptor closed over, so pending state / errors are surfaced via
 * the returned {@link IUseActionPressResult}.
 *
 * @typeParam D - Descriptor variant to dispatch.
 * @typeParam R - Response data payload type.
 * @param descriptor - The descriptor to dispatch on every press.
 * @param options - Optional caller context + done-callback.
 * @returns A stable `onPress` handler plus reactive state.
 *
 * @example
 * ```tsx
 * import { useActionPress } from '@stackra/actions/react';
 *
 * function SaveButton() {
 *   const { onPress, isPending } = useActionPress({
 *     kind: 'toast',
 *     message: 'Saved',
 *   });
 *   return <Button isPending={isPending} onPress={onPress}>Save</Button>;
 * }
 * ```
 */
export function useActionPress<D extends IActionDescriptor = IActionDescriptor, R = unknown>(
  descriptor: D,
  options: IUseActionPressOptions<D, R> = {},
): IUseActionPressResult<R> {
  const { run, reset, isPending, response, data, error } = useAction<D, R>(descriptor.kind);
  const { context, onDone } = options;

  // A stable callback so React memoization consumers (HeroUI `Button`,
  // `React.memo`) don't re-render on every dispatch cycle.
  const onPress = useCallback(async (): Promise<IActionResponse<R>> => {
    const result = await run(descriptor, context);
    onDone?.(result, descriptor);
    return result;
  }, [run, descriptor, context, onDone]);

  return { onPress, reset, isPending, response, data, error };
}
