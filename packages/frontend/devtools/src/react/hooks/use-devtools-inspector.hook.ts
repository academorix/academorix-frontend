/**
 * @file use-devtools-inspector.hook.ts
 * @module @stackra/devtools/react/hooks
 * @description Read + toggle the inspector overlay + subscribe to
 *   the inspector registry.
 *
 *   Consumers who want the current region list (for the overlay
 *   itself) get it via `useSyncExternalStore` on the registry;
 *   consumers who only need the toggle read the inner
 *   `DevtoolsInspectorContext` for a stable identity.
 */

import { useCallback, useContext, useSyncExternalStore } from 'react';
import type { IDevtoolsInspectorRegion } from '@stackra/contracts';

import { DevtoolsInspectorContext } from '../contexts/devtools-inspector.context';
import { useDevtoolsContext } from './use-devtools-context.hook';

/** Result returned by {@link useDevtoolsInspector}. */
export interface IUseDevtoolsInspectorResult {
  /** Whether the overlay is active. */
  readonly enabled: boolean;
  /** Toggle the overlay. */
  readonly toggle: () => void;
  /** Explicitly set the overlay's enabled state. */
  readonly setEnabled: (next: boolean) => void;
  /** Every region collected from every source, flattened. */
  readonly regions: readonly IDevtoolsInspectorRegion[];
}

/**
 * Read + toggle the inspector overlay.
 */
export function useDevtoolsInspector(): IUseDevtoolsInspectorResult {
  const ctx = useContext(DevtoolsInspectorContext);
  const { inspector } = useDevtoolsContext();

  const subscribe = useCallback(
    (listener: () => void) => inspector.subscribe(listener),
    [inspector]
  );
  const getSnapshot = useCallback(() => inspector.collectAll(), [inspector]);
  const regions = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const enabled = ctx?.enabled ?? false;
  const setEnabled = useCallback((next: boolean) => ctx?.setEnabled(next), [ctx]);
  const toggle = useCallback(() => ctx?.toggle(), [ctx]);

  return { enabled, setEnabled, toggle, regions };
}
