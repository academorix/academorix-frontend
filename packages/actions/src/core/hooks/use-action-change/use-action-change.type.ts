/**
 * @file use-action-change.type.ts
 * @module @stackra/actions/core/hooks/use-action-change
 * @description Mapper type for the `useActionChange` hook.
 */

import type { IActionDescriptor } from '@stackra/contracts';

/**
 * Function invoked on every `onChange` event to produce the descriptor
 * to dispatch.
 *
 * @typeParam V - Value type emitted by the underlying input.
 * @typeParam D - Descriptor variant produced.
 * @param value - The new value from the input.
 * @param base - The descriptor `useActionChange` was bound to.
 * @returns The descriptor to dispatch — typically `base` merged with `value`.
 */
export type ActionChangeMapper<V = unknown, D extends IActionDescriptor = IActionDescriptor> = (
  value: V,
  base: D
) => D;
