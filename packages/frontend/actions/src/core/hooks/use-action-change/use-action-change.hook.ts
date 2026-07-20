/**
 * @file use-action-change.hook.ts
 * @module @stackra/actions/core/hooks/use-action-change
 * @description `useActionChange(descriptor, mapper, options?)` — bind a
 *   descriptor to an `onChange` handler for controlled inputs.
 */

import { useCallback } from "react";
import type { IActionDescriptor, IActionResponse } from "@stackra/contracts";

import { useAction } from "../use-action";
import type { IUseActionPressOptions } from "../use-action-press/use-action-press.interface";
import type { ActionChangeMapper } from "./use-action-change.type";

/**
 * Result of {@link useActionChange} — an `onChange(value)` handler + state.
 *
 * @typeParam V - Value type emitted by the underlying input.
 * @typeParam R - Response data payload type.
 */
export interface IUseActionChangeResult<V = unknown, R = unknown> {
  /** `onChange(value)` handler suitable for HeroUI / RN controlled inputs. */
  readonly onChange: (value: V) => Promise<IActionResponse<R>>;

  /** Whether an invocation is currently in flight. */
  readonly isPending: boolean;

  /** Failure message from the most recent run, or `null`. */
  readonly error: string | null;

  /** Reset the reactive state. */
  readonly reset: () => void;
}

/**
 * Bind a descriptor + a value-to-descriptor `mapper` to an `onChange`
 * handler suitable for controlled inputs (HeroUI `TextField`, `Select`,
 * React Native `TextInput`).
 *
 * @typeParam V - Value type emitted by the underlying input.
 * @typeParam D - Descriptor variant to dispatch.
 * @typeParam R - Response data payload type.
 * @param base - The base descriptor to merge new values into.
 * @param mapper - Function producing the final descriptor given the value.
 * @param options - Optional caller context + done-callback.
 * @returns Stable `onChange` handler + pending state.
 *
 * @example
 * ```tsx
 * import { useActionChange } from '@stackra/actions/react';
 *
 * function LocaleSelector() {
 *   const { onChange, isPending } = useActionChange<string, ISetStateAction>(
 *     { kind: 'setState', path: 'i18n.locale', value: '' },
 *     (v, base) => ({ ...base, value: v }),
 *   );
 *   return <Select isDisabled={isPending} onChange={onChange}>...</Select>;
 * }
 * ```
 */
export function useActionChange<
  V = unknown,
  D extends IActionDescriptor = IActionDescriptor,
  R = unknown,
>(
  base: D,
  mapper: ActionChangeMapper<V, D>,
  options: IUseActionPressOptions<D, R> = {},
): IUseActionChangeResult<V, R> {
  const { run, reset, isPending, error } = useAction<D, R>(base.kind);
  const { context, onDone } = options;

  const onChange = useCallback(
    async (value: V): Promise<IActionResponse<R>> => {
      // Map the incoming value into the final descriptor. `mapper` is
      // caller-owned so it can pick which descriptor field the value
      // fills (`value`, `payload`, `body`, ...).
      const descriptor = mapper(value, base);
      const result = await run(descriptor, context);
      onDone?.(result, descriptor);
      return result;
    },
    [run, mapper, base, context, onDone],
  );

  return { onChange, isPending, error, reset };
}
