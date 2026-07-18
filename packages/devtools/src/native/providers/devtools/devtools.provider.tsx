/**
 * @file devtools.provider.tsx
 * @module @stackra/devtools/native/providers
 * @description The native `DevtoolsProvider` — resolves the
 *   registries + services from the surrounding DI container and
 *   exposes them via `DevtoolsContext` for the native shell tree.
 *
 *   Mirrors the web provider's contract minus the inspector
 *   context (native has no inspector overlay yet — that's a
 *   future enhancement) and the keyboard shortcut binding
 *   (nonsensical on RN).
 */

import { useEffect, useMemo, useState, type ReactElement, type ReactNode } from 'react';
import { useInject, useOptionalInject } from '@stackra/container/react';
import {
  DEVTOOLS_INSPECTOR_REGISTRY,
  DEVTOOLS_REGISTRY,
  type IDevtoolsInspectorRegistry,
  type IDevtoolsPanelsRegistry,
} from '@stackra/contracts';

import { DEFAULT_DEVTOOLS_CONFIG, DEVTOOLS_CONFIG } from '@/core/constants';
import type { IDevtoolsModuleOptions } from '@/core/interfaces';
import { DevtoolsAnalyticsService, DevtoolsFrameStateService } from '@/core/services';
import { mergeConfig } from '@/core/utils';

import { DevtoolsContext } from '../../contexts/devtools.context';
import type { IDevtoolsNativeContextValue } from '../../interfaces/devtools-context-value.interface';
import { ActionsNativeDevtoolsPanel, OverviewNativeDevtoolsPanel } from '../../panels';

/** Props accepted by {@link DevtoolsProvider}. */
export interface DevtoolsProviderProps {
  /** Children — the rest of the native shell tree. */
  readonly children: ReactNode;
}

/**
 * Wraps the native shell tree in the devtools context.
 *
 * @example
 * ```tsx
 * import { DevtoolsProvider, DevtoolsShell } from '@stackra/devtools/native';
 *
 * <DevtoolsProvider>
 *   <DevtoolsShell />
 * </DevtoolsProvider>
 * ```
 */
export function DevtoolsProvider({ children }: DevtoolsProviderProps): ReactElement {
  // Resolve registries — required. If either is missing we surface
  // a helpful error via the `useInject` throw at the container
  // layer.
  const panels = useInject<IDevtoolsPanelsRegistry>(DEVTOOLS_REGISTRY);
  const inspector = useInject<IDevtoolsInspectorRegistry>(DEVTOOLS_INSPECTOR_REGISTRY);
  // Frame-state + analytics services — bound in
  // `DevtoolsModule.forRoot`.
  const frameState = useInject(DevtoolsFrameStateService);
  const analytics = useInject(DevtoolsAnalyticsService);
  // Config is optional — fall back to defaults when missing.
  const rawConfig = useOptionalInject<IDevtoolsModuleOptions>(DEVTOOLS_CONFIG);
  const config = useMemo(() => rawConfig ?? mergeConfig(DEFAULT_DEVTOOLS_CONFIG), [rawConfig]);

  // Snapshot the mount timestamp once — the Overview panel reads
  // this to compute session uptime.
  const [mountedAt] = useState<number>(() => Date.now());

  const contextValue = useMemo<IDevtoolsNativeContextValue>(
    () => ({ config, panels, inspector, frameState, analytics, mountedAt }),
    [config, panels, inspector, frameState, analytics, mountedAt]
  );

  // Register the built-in Overview + Actions panels while the
  // provider is mounted. The registry is last-wins per id, so a
  // feature package can still ship its own panel with
  // `id: 'overview'` and override the built-in. Instance
  // identities are stable across renders so we register only
  // once; unmount cleans up.
  useEffect(() => {
    const overview = new OverviewNativeDevtoolsPanel();
    const actions = new ActionsNativeDevtoolsPanel();
    panels.register(overview);
    panels.register(actions);
    return () => {
      panels.unregister(overview.id);
      panels.unregister(actions.id);
    };
  }, [panels]);

  return <DevtoolsContext.Provider value={contextValue}>{children}</DevtoolsContext.Provider>;
}
