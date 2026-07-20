/**
 * @file use-route-mode.hook.ts
 * @module @stackra/routing/react/hooks/use-route-mode
 * @description Read the current route's `mode` from its private
 *   `handle[STACKRA_HANDLE]` bag.
 *
 *   Returns `'page'` when no mode was set — matches the PLAN default.
 */

import type { IRouteMode } from "@stackra/contracts";

import { STACKRA_HANDLE } from "@/core/constants";
import { useCurrentMatch } from "../use-current-match";

/**
 * Return the current route's presentation mode.
 *
 * @returns Mode value — `'page'` when unset.
 *
 * @example
 * ```typescript
 * const mode = useRouteMode();
 * if (mode === 'dialog') openModal();
 * ```
 */
export function useRouteMode(): IRouteMode {
  const match = useCurrentMatch();
  const stackra = (match?.handle?.[STACKRA_HANDLE] ?? undefined) as
    { readonly mode?: IRouteMode } | undefined;
  return stackra?.mode ?? "page";
}
