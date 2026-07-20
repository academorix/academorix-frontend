/**
 * @file use-store-dispatch.hook.ts
 * @module @stackra/state/react/hooks
 * @description Get the `setState` function from a DI-managed store.
 *
 *   Use when a component needs to mutate state directly (rare — prefer
 *   `useMutation` from `@stackra/query` for optimistic/server-backed writes).
 */

import { useInject } from '@stackra/container/react';
import type { Store } from '@tanstack/store';

/**
 * Get the setState function from a DI-managed store.
 *
 * @typeParam S - The full state shape of the store.
 * @param token - The DI token (Symbol) for the store.
 * @returns A function to update the store state.
 *
 * @example
 * ```typescript
 * const dispatch = useStoreDispatch<ThemeState>(THEME_STORE);
 * const toggle = () => dispatch((s) => ({ ...s, mode: s.mode === 'light' ? 'dark' : 'light' }));
 * ```
 */
export function useStoreDispatch<S>(token: symbol): (updater: (state: S) => S) => void {
  const store = useInject<Store<S>>(token);
  return (updater: (state: S) => S) => store.setState(updater);
}
