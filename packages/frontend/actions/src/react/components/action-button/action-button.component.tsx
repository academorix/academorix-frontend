/**
 * @file action-button.component.tsx
 * @module @stackra/actions/react/components/action-button
 * @description `<ActionButton action={...} />` — a HeroUI `Button`
 *   pre-wired to dispatch a descriptor on press.
 *
 *   @deprecated Prefer the polymorphic `<Action>` slot from
 *   `@stackra/actions/react` composed over any HeroUI pressable —
 *   `<Action action={...}><Button>Save</Button></Action>`. The slot
 *   works with every HeroUI OSS / Pro / Native / Native-Pro pressable
 *   and doesn't lock the caller into HeroUI's `Button`. This wrapper
 *   stays exported for back-compat and will be removed in a future
 *   major.
 */

import type { ComponentProps } from "react";
import type { IActionContext, IActionDescriptor, IActionResponse } from "@stackra/contracts";
import { Button } from "@stackra/ui/react";

import { useAction } from "@/core/hooks/use-action";

/** HeroUI `Button`'s prop shape — cached so the interface stays terse. */
type ButtonProps = ComponentProps<typeof Button>;

/**
 * Props for {@link ActionButton}.
 *
 * @deprecated See file docblock — use `<Action>` from
 * `@stackra/actions/react` composed over any HeroUI pressable instead.
 *
 * @typeParam D - Descriptor variant to dispatch.
 * @typeParam R - Response data payload type.
 */
export interface IActionButtonProps<
  D extends IActionDescriptor = IActionDescriptor,
  R = unknown,
> extends Omit<ButtonProps, "onPress"> {
  /** The action descriptor to dispatch on press. */
  readonly action: D;

  /** Optional caller-supplied context merged into the dispatch. */
  readonly context?: IActionContext;

  /** Callback fired after the action resolves — success or failure. */
  readonly onDone?: (response: IActionResponse<R>) => void;
}

/**
 * HeroUI `Button` bound to a single action descriptor. Renders a
 * spinner while the dispatch is in flight (via HeroUI's native
 * `isPending`).
 *
 * @deprecated Prefer `<Action>`. See file docblock.
 *
 * @example
 * ```tsx
 * <ActionButton action={{ kind: 'toast', message: 'Saved' }}>Save</ActionButton>
 * ```
 */
export function ActionButton<D extends IActionDescriptor = IActionDescriptor, R = unknown>({
  action,
  context,
  onDone,
  children,
  ...rest
}: IActionButtonProps<D, R>) {
  const { run, isPending } = useAction<D, R>(action.kind);

  return (
    <Button
      {...rest}
      isPending={isPending}
      onPress={async () => {
        const response = await run(action, context);
        onDone?.(response);
      }}
    >
      {children}
    </Button>
  );
}
