/**
 * @file use-route-state.hook.ts
 * @module @stackra/routing/react/hooks/use-route-state
 * @description Read the shared middleware state bag for the current
 *   route.
 *
 *   Middleware writes into `ctx.state` during the chain. The framework
 *   mirrors that state onto `handle[STACKRA_HANDLE].state` for
 *   consumers who want to read it from components without touching
 *   the container.
 *
 * TODO(state): F.2 ships a stub reading straight from the handle —
 *   the full store integration lands with @stackra/state.
 */

import { STACKRA_HANDLE } from "@/core/constants";
import { useCurrentMatch } from "../use-current-match";

/**
 * Return the middleware-prepared state for the current route.
 *
 * @typeParam TState - Expected shape of the accumulated state.
 * @returns The state bag. Empty object when the route wrote none.
 *
 * @example
 * ```typescript
 * const { user } = useRouteState<{user: User}>();
 * ```
 */
export function useRouteState<TState extends object = Record<string, unknown>>(): TState {
  const match = useCurrentMatch();
  const stackra = (match?.handle?.[STACKRA_HANDLE] ?? undefined) as
    { readonly state?: TState } | undefined;
  // Default to an empty object so consumers can destructure safely
  // even before middleware has produced any state.
  return (stackra?.state ?? ({} as TState)) as TState;
}
