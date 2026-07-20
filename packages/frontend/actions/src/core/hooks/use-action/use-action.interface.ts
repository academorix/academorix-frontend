/**
 * @file use-action.interface.ts
 * @module @stackra/actions/core/hooks/use-action
 * @description State + result contracts for the `useAction` hook.
 *
 *   Interfaces belong to the `useAction` entity family (per the React
 *   entity exception in `code-standards.md`).
 */

import type { IActionContext, IActionDescriptor, IActionResponse } from '@stackra/contracts';

/**
 * Reactive state exposed by {@link useAction}.
 *
 * @typeParam R - Response data payload type.
 */
export interface IUseActionState<R = unknown> {
  /** Whether an invocation is currently in flight. */
  readonly isPending: boolean;

  /** The most recent response (success or failure), or `null` before the first run. */
  readonly response: IActionResponse<R> | null;

  /** The most recent successful data payload, or `null` when the last run failed. */
  readonly data: R | null;

  /** Failure message from the most recent run, or `null` on success / before first run. */
  readonly error: string | null;
}

/**
 * Full result surface returned by {@link useAction} — state plus imperative
 * controls.
 *
 * @typeParam D - Descriptor variant this hook is bound to.
 * @typeParam R - Response data payload type.
 */
export interface IUseActionResult<
  D extends IActionDescriptor = IActionDescriptor,
  R = unknown,
> extends IUseActionState<R> {
  /**
   * Dispatch a descriptor through the framework pipeline.
   *
   * The returned promise mirrors the dispatcher's response contract — it
   * never throws; failures surface as `{ success: false, message }` on
   * the resolved value.
   */
  readonly run: (descriptor: D, context?: IActionContext) => Promise<IActionResponse<R>>;

  /** Reset every state field to its initial value. */
  readonly reset: () => void;
}
