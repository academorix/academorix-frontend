/**
 * @file use-navigate.hook.ts
 * @module @stackra/routing/react/hooks/use-navigate
 * @description Programmatic navigation hook.
 *
 *   Returns `(to, opts?) => Promise<void>` that dispatches through
 *   the routing provider's RRv7 router.
 *
 * TODO(actions): swap to `useAction<INavigateAction, void>('navigate')`
 *   when @stackra/actions runtime lands. F.2 ships a temporary
 *   internal implementation. Consumer call sites stay identical.
 */

import { useCallback } from "react";
import type { INavigateOptions } from "@stackra/contracts";

import { navigate as internalNavigate } from "@/react/internal";
import { useStackraRoutingContext } from "../use-stackra-routing-context";

/**
 * Return a navigate function that dispatches through the routing
 * provider's RRv7 router.
 *
 * @returns Navigate function.
 *
 * @example
 * ```typescript
 * const navigate = useNavigate();
 * await navigate('/dashboard');
 * ```
 */
export function useNavigate(): (to: string, opts?: INavigateOptions) => Promise<void> {
  const { router } = useStackraRoutingContext();
  return useCallback(
    (to: string, opts?: INavigateOptions) => internalNavigate(router, to, opts),
    // TODO(actions): the router reference stays stable across renders
    // — memoise so downstream `useEffect`s don't re-fire.
    [router],
  );
}
