/**
 * @file use-native-devtools-panels.hook.ts
 * @module @stackra/devtools/native/hooks
 * @description Native equivalent of the web
 *   `useDevtoolsPanels` hook — same shape, same
 *   `useSyncExternalStore` contract.
 *
 *   Kept in a separate file (rather than re-exported from the web
 *   hook) because the native subpath must NOT import from
 *   `../react`. React Native doesn't consume the web-DOM tree.
 */

import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { useInject } from '@stackra/container/react';
import {
  DEVTOOLS_REGISTRY,
  type DevtoolsCategory,
  type IDevtoolsPanel,
  type IDevtoolsPanelsRegistry,
} from '@stackra/contracts';

/** Result returned by {@link useNativeDevtoolsPanels}. */
export interface IUseNativeDevtoolsPanelsResult {
  /** Every registered panel. */
  readonly panels: readonly IDevtoolsPanel[];
  /** Panels grouped by category. */
  readonly byCategory: ReadonlyMap<DevtoolsCategory, readonly IDevtoolsPanel[]>;
  /** Find a panel by id. */
  readonly find: (id: string) => IDevtoolsPanel | null;
}

/**
 * Native panels hook. Same contract as the web `useDevtoolsPanels`.
 */
export function useNativeDevtoolsPanels(): IUseNativeDevtoolsPanelsResult {
  const registry = useInject<IDevtoolsPanelsRegistry>(DEVTOOLS_REGISTRY);
  const subscribe = useCallback((listener: () => void) => registry.subscribe(listener), [registry]);
  const getSnapshot = useCallback(() => registry.list(), [registry]);
  const panels = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const byCategory = useMemo(
    () => registry.byCategory(),
    // registry.byCategory is derived from `panels` (the snapshot);
    // recompute when the snapshot identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [registry, panels]
  );
  const find = useCallback((id: string) => registry.find(id), [registry]);
  return { panels, byCategory, find };
}
