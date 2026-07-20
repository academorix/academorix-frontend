/**
 * @file action.component.tsx
 * @module @stackra/actions/core/components/action
 * @description `<Action>` — the polymorphic slot that binds an action
 *   descriptor to any pressable child (HeroUI OSS/Pro `Button`, React
 *   Native `Pressable`, plain HTML `<button>`, HeroUI `Switch`,
 *   `Select`, ...).
 *
 *   Composition contract:
 *
 *   - Wrap exactly one React element.
 *   - The slot clones that element, injecting the descriptor-bound
 *     event handler on the child's `onPress` (default) or a
 *     caller-specified `eventProp`.
 *   - `isPending` is forwarded on the child while a dispatch is in
 *     flight, so HeroUI pressables render their spinner natively.
 *
 *   Cross-platform: renders on React DOM and React Native. Both
 *   `@stackra/actions/react` and `@stackra/actions/native` re-export
 *   this component.
 */

import { Children, cloneElement, isValidElement, type ReactElement } from "react";
import type { IActionDescriptor } from "@stackra/contracts";

import { useAction } from "@/core/hooks/use-action";
import { enhanceActionChildProps } from "./enhance-child-props.util";
import type { IActionChildProps, IActionSlotProps } from "./action.interface";

/**
 * `<Action>` — polymorphic slot wiring a descriptor to a child's event
 * handler.
 *
 * @typeParam D - Descriptor variant being dispatched.
 * @typeParam R - Response data payload type.
 *
 * @throws When passed zero children or more than one — the slot
 * enforces a single React child so `cloneElement` has an unambiguous
 * target (matches Radix Slot / React Aria Pressable semantics).
 *
 * @example HeroUI Button:
 * ```tsx
 * import { Action } from '@stackra/actions/react';
 * import { Button } from '@stackra/ui/react';
 *
 * <Action action={{ kind: 'toast', message: 'Saved' }}>
 *   <Button>Save</Button>
 * </Action>
 * ```
 *
 * @example Plain HTML button:
 * ```tsx
 * <Action action={{ kind: 'toast', message: 'Saved' }} eventProp="onClick">
 *   <button type="button">Save</button>
 * </Action>
 * ```
 */
export function Action<D extends IActionDescriptor = IActionDescriptor, R = unknown>({
  action,
  context,
  eventProp,
  onDone,
  forwardPending,
  children,
}: IActionSlotProps<D, R>) {
  const { run, isPending } = useAction<D, R>(action.kind);

  // `Children.only` throws on 0 or 2+ children, which is exactly the
  // contract we want — the slot's whole job is to clone one element.
  const child = Children.only(children);

  // Guard against literal string / number children (`<Action>Save</Action>`)
  // that `Children.only` accepts but `cloneElement` can't enhance.
  if (!isValidElement(child)) {
    throw new Error(
      "<Action> requires a single React element child (e.g. a Button); received a text or fragment child.",
    );
  }

  const enhanced = enhanceActionChildProps<D, R>(
    child as ReactElement<IActionChildProps>,
    action,
    run,
    isPending,
    { eventProp, context, onDone, forwardPending },
  );

  return cloneElement(child, enhanced);
}
