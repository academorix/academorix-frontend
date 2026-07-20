/**
 * @file use-action-press.interface.ts
 * @module @stackra/actions/core/hooks/use-action-press
 * @description Result contract for the `useActionPress` hook.
 */

import type { IActionContext, IActionDescriptor, IActionResponse } from '@stackra/contracts';
import type { IUseActionState } from '../use-action/use-action.interface';

/**
 * Options accepted by {@link useActionPress}.
 *
 * @typeParam D - Descriptor variant this hook is bound to.
 * @typeParam R - Response data payload type.
 */
export interface IUseActionPressOptions<
  D extends IActionDescriptor = IActionDescriptor,
  R = unknown,
> {
  /** Caller-supplied context merged into every dispatch. */
  readonly context?: IActionContext;

  /** Callback fired after each dispatch resolves — success or failure. */
  readonly onDone?: (response: IActionResponse<R>, descriptor: D) => void;
}

/**
 * Result of {@link useActionPress} — a HeroUI/React-Native-compatible
 * `onPress` handler plus the same reactive state {@link useAction}
 * exposes.
 *
 * @typeParam R - Response data payload type.
 */
export interface IUseActionPressResult<R = unknown> extends IUseActionState<R> {
  /**
   * `onPress` handler suitable for HeroUI `Button.onPress`, React
   * Native `Pressable.onPress`, or any pressable that accepts a
   * zero-argument callback.
   */
  readonly onPress: () => Promise<IActionResponse<R>>;

  /** Reset the reactive state to its initial values. */
  readonly reset: () => void;
}
