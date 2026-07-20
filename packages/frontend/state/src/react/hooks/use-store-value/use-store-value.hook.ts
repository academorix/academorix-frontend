/**
 * @file use-store-value.hook.ts
 * @module @stackra/state/react/hooks
 * @description Read a reactive slice from a DI-managed store.
 *
 *   Behaviourally identical to `useStore` — kept as a named alias for
 *   call-sites that prefer the more explicit "value" verb.
 */

import { useSelector } from "@tanstack/react-store";
import { useInject } from "@stackra/container/react";
import type { Store } from "@tanstack/store";
import type { StateSelector } from "@/core/types/state-selector.type";

/**
 * Read a reactive slice from a DI-managed store.
 *
 * @typeParam S - The full state shape of the store.
 * @typeParam R - The selected return type.
 * @param token - The DI token (Symbol) for the store.
 * @param selector - Function that extracts the desired slice from state.
 * @returns The selected value (reactive — triggers re-render on change).
 *
 * @example
 * ```typescript
 * const locale = useStoreValue<LocaleState, string>(I18N_STORE, (s) => s.locale);
 * ```
 */
export function useStoreValue<S, R>(token: symbol, selector: StateSelector<S, R>): R {
  const store = useInject<Store<S>>(token);
  return useSelector(store, selector);
}
