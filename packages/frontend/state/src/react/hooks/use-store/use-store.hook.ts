/**
 * @file use-store.hook.ts
 * @module @stackra/state/react/hooks
 * @description Unified reactive read hook for DI-managed stores.
 *
 *   Resolves the store from the DI container by token, then subscribes to a
 *   selected slice. The component re-renders only when the selected value
 *   changes.
 */

import { useSelector } from "@tanstack/react-store";
import { useInject } from "@stackra/container/react";
import type { Store } from "@tanstack/store";
import type { StateSelector } from "@/core/types/state-selector.type";

/**
 * Read a reactive slice from a DI-managed store.
 *
 * The component only re-renders when the selected value changes. Uses
 * referential equality by default — return primitives or memoized objects
 * from the selector for optimal performance.
 *
 * @typeParam S - The full state shape of the store.
 * @typeParam R - The selected return type.
 * @param token - The DI token (Symbol) for the store.
 * @param selector - Function that extracts the desired slice from state.
 * @returns The selected value (reactive — triggers re-render on change).
 *
 * @example
 * ```typescript
 * import { useStore } from '@stackra/state/react';
 * import { THEME_STORE } from '@stackra/contracts';
 *
 * function ThemeDisplay() {
 *   const mode = useStore<ThemeState, string>(THEME_STORE, (s) => s.mode);
 *   return <span>{mode}</span>;
 * }
 * ```
 */
export function useStore<S, R>(token: symbol, selector: StateSelector<S, R>): R {
  const store = useInject<Store<S>>(token);
  return useSelector(store, selector);
}
