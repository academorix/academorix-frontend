/**
 * @file navigate.util.ts
 * @module @stackra/routing/react/internal
 * @description Temporary internal navigate helper for F.2.
 *
 *   PLAN v3.2 / v3.9.1 target: navigation dispatches through
 *   `useAction<INavigateAction, void>('navigate')` from
 *   `@stackra/actions/react`. That package is a `0.0.0-shell` for
 *   F.2 — the primitive doesn't exist yet.
 *
 *   F.2 workaround: call `router.navigate(to, opts)` directly on the
 *   RRv7 data-router instance held by `<StackraRoutingProvider>`.
 *   Every consumer hook goes through this util so a G-phase swap
 *   flips ONE file, not every call site.
 *
 * TODO(actions): swap the body to
 *   `run({kind: 'navigate', to, ...opts})` when @stackra/actions
 *   runtime lands.
 */

import type { INavigateOptions } from "@stackra/contracts";

import type { IStackraRouter } from "@/react/contexts/stackra-routing/stackra-routing-context-value.interface";

/**
 * Navigate the router to `to` with the given options.
 *
 * @param router - The RRv7 data-router instance (held by the routing
 *   provider context).
 * @param to     - Destination — an absolute path or a delta.
 * @param opts   - Standard navigate options.
 * @returns Promise resolving when the navigation settles.
 *
 * @example
 * ```typescript
 * // TODO(actions): swap to useAction<INavigateAction, void>('navigate')
 * //  when @stackra/actions runtime lands.
 * await navigate(router, '/dashboard', {replace: true});
 * ```
 */
export async function navigate(
  router: IStackraRouter,
  to: string,
  opts?: INavigateOptions,
): Promise<void> {
  // The RRv7 `navigate` method accepts a string OR a delta OR a
  // location. We route through `to` as a pathname; upstream callers
  // sanitise the target.
  await router.navigate(to, {
    replace: opts?.replace,
    state: opts?.state,
    preventScrollReset: opts?.preventScrollReset,
  });
}
