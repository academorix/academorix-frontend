/**
 * @file enhance-child-props.util.ts
 * @module @stackra/actions/core/components/action
 * @description `enhanceActionChildProps` — a pure helper that produces
 *   the second argument for `React.cloneElement(child, next)` such that
 *   the child fires an action dispatch on its natural event prop.
 *
 *   Owned by the `<Action>` entity per the React entity exception in
 *   `code-standards.md` — kept adjacent to the component that uses it.
 *   Also exported publicly for advanced call sites that need to enhance
 *   a child outside the `<Action>` slot itself.
 */

import type { ReactElement } from 'react';
import type { IActionContext, IActionDescriptor, IActionResponse } from '@stackra/contracts';

import type { IActionChildProps, IEnhanceOptions, IEnhancedChildProps } from './action.interface';

/**
 * Merge two callbacks so both fire when the resulting function is
 * invoked. The child's original callback runs first, followed by the
 * action-driven one — matching the React convention that user-supplied
 * event handlers run before framework-injected ones.
 *
 * @param existing - Child's original callback, if any.
 * @param injected - Slot-injected callback.
 * @returns A single callback that fires both.
 */
function chainHandlers(
  existing: ((...args: unknown[]) => unknown) | undefined,
  injected: (...args: unknown[]) => unknown
): (...args: unknown[]) => unknown {
  if (!existing) return injected;
  return (...args: unknown[]) => {
    // Fire the caller's handler first. Ignore its return value — the
    // slot's dispatch is fire-and-forget from the child's perspective.
    void existing(...args);
    return injected(...args);
  };
}

/**
 * Produce the props object `React.cloneElement(child, next)` accepts
 * such that dispatching `descriptor` fires whenever the child's
 * configured event prop is invoked.
 *
 * ### Behavior
 *
 * - Injects a handler under `options.eventProp` (defaults to `'onPress'`
 *   so HeroUI and React Native pressables work out of the box).
 * - Chains the child's existing handler on that prop with the injected
 *   one — original runs first, then dispatch (fire-and-forget so the
 *   caller's synchronous side effects aren't blocked by the dispatch
 *   promise).
 * - When `forwardPending` is `true` (default), forwards `isPending`
 *   onto the child if the child accepts it. HeroUI pressables render a
 *   loader when `isPending`; RN pressables don't, but forwarding is
 *   harmless.
 * - Preserves every other prop on the child untouched.
 *
 * @typeParam D - Descriptor variant being dispatched.
 * @typeParam R - Response data payload type.
 * @param child - Single React element the `<Action>` slot wraps.
 * @param descriptor - Action descriptor to dispatch on child event.
 * @param dispatch - Bound dispatcher (typically from `useAction().run`).
 * @param isPending - Whether a dispatch is currently in flight.
 * @param options - Additional caller-facing options.
 * @returns Enhanced props object for `cloneElement`.
 */
export function enhanceActionChildProps<
  D extends IActionDescriptor = IActionDescriptor,
  R = unknown,
>(
  child: ReactElement<IActionChildProps>,
  descriptor: D,
  dispatch: (d: D, ctx?: IActionContext) => Promise<IActionResponse<R>>,
  isPending: boolean,
  options: IEnhanceOptions<D, R> = {}
): IEnhancedChildProps {
  // Default to `onPress` — the shared event name used by HeroUI Button
  // + React Aria Pressable + React Native Pressable. HTML button
  // consumers explicitly pass `eventProp: 'onClick'`.
  const eventProp = options.eventProp ?? 'onPress';
  const forwardPending = options.forwardPending ?? true;

  const injected = async (): Promise<void> => {
    const response = await dispatch(descriptor, options.context);
    options.onDone?.(response, descriptor);
  };

  const existing = child.props[eventProp] as ((...args: unknown[]) => unknown) | undefined;
  const merged = chainHandlers(existing, injected);

  // Only forward pending when both requested AND the child already
  // acknowledges the prop — avoid smuggling unknown props into DOM
  // elements which React logs as a warning.
  const shouldForwardPending = forwardPending && 'isPending' in child.props;

  // Build the enhanced object in a single expression so the resulting
  // shape stays compatible with the readonly `IEnhancedChildProps`
  // contract (React props are immutable — enhancement is construction,
  // not mutation).
  const enhanced: IEnhancedChildProps = shouldForwardPending
    ? {
        ...child.props,
        [eventProp]: merged,
        isPending: Boolean(child.props.isPending) || isPending,
      }
    : {
        ...child.props,
        [eventProp]: merged,
      };

  return enhanced;
}
