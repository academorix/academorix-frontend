/**
 * @file use-back.hook.ts
 * @module @stackra/routing/react/hooks/use-back
 * @description Programmatic back-navigation hook per PLAN v3.5.
 *
 *   Signature: `useBack(fallback?: string | number)`.
 *
 *   - If `useCanGoBack()` returns `true`, calls `router.go(-1)` (or
 *     `router.go(N)` when the fallback is a number).
 *   - Otherwise navigates to the fallback (string) or the default
 *     landing route (`/`) when no fallback is set.
 *
 * TODO(actions): swap the internal navigate call to
 *   `useAction<INavigateAction, void>('navigate')` when
 *   @stackra/actions runtime lands.
 */

import { useCallback } from "react";

import { navigate as internalNavigate } from "@/react/internal";
import { useCanGoBack } from "../use-can-go-back";
import { useStackraRoutingContext } from "../use-stackra-routing-context";

/**
 * Return a `back()` callback per PLAN v3.5 semantics.
 *
 * @param fallback - When the browser has no back history, either a
 *   pathname (`'/dashboard'`) OR a numeric offset. Number offsets
 *   call `router.go(N)` directly (bypass the "no back available"
 *   fallback path).
 * @returns Callback that performs the back navigation.
 *
 * @example
 * ```typescript
 * const back = useBack('/dashboard');
 * // Navigates back if possible; otherwise pushes /dashboard.
 * ```
 */
export function useBack(fallback?: string | number): () => Promise<void> {
  const { router } = useStackraRoutingContext();
  const canGoBack = useCanGoBack();

  return useCallback(async () => {
    // Number offset short-circuit — apply directly on the router.
    if (typeof fallback === "number") {
      // TODO(actions): route through the navigate action once the
      //  action layer supports delta-navigation.
      router.navigate(fallback);
      return;
    }

    // Standard "browser back" path — one step back if we can.
    if (canGoBack) {
      // TODO(actions): swap to useAction<INavigateAction, void>('navigate')
      //  when @stackra/actions runtime lands.
      router.navigate(-1);
      return;
    }

    // Fall back — either to the string fallback or the site root.
    await internalNavigate(router, fallback ?? "/");
  }, [router, canGoBack, fallback]);
}
