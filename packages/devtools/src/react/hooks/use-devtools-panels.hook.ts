/**
 * @file use-devtools-panels.hook.ts
 * @module @stackra/devtools/react/hooks
 * @description Subscribes to the panels registry via
 *   `useSyncExternalStore` — the canonical tearing-free read
 *   pattern under React 18+ concurrent rendering.
 *
 *   Returns a memoised object with the flat list plus the
 *   by-category grouping the nav rail consumes.
 */

import { useCallback, useMemo, useSyncExternalStore } from 'react';
import type { DevtoolsCategory, IDevtoolsPanel } from '@stackra/contracts';

import { useDevtoolsContext } from './use-devtools-context.hook';

/** Result returned by {@link useDevtoolsPanels}. */
export interface IUseDevtoolsPanelsResult {
  /** Every registered panel, sorted by order + id. */
  readonly panels: readonly IDevtoolsPanel[];
  /** Panels grouped by category. */
  readonly byCategory: ReadonlyMap<DevtoolsCategory, readonly IDevtoolsPanel[]>;
  /** Find a panel by id — falls back to `null`. */
  readonly find: (id: string) => IDevtoolsPanel | null;
}

/**
 * Subscribe to the panels registry.
 *
 * @example
 * ```tsx
 * const { panels, byCategory } = useDevtoolsPanels();
 * ```
 */
export function useDevtoolsPanels(): IUseDevtoolsPanelsResult {
  const { panels } = useDevtoolsContext();

  // Stable-identity subscribe fn — otherwise `useSyncExternalStore`
  // would resubscribe on every render.
  const subscribe = useCallback((listener: () => void) => panels.subscribe(listener), [panels]);
  // The registry returns a stable snapshot until the next mutation;
  // that's the exact contract `useSyncExternalStore` requires.
  const getSnapshot = useCallback(() => panels.list(), [panels]);

  const list = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const byCategory = useMemo(() => panels.byCategory(), [panels, list]);

  const find = useCallback((id: string) => panels.find(id), [panels]);

  return { panels: list, byCategory, find };
}
