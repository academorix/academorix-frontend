/**
 * @file devtools.provider.tsx
 * @module @stackra/devtools/react/providers
 * @description The `DevtoolsProvider` — resolves the registries +
 *   services from the surrounding DI container and hands them down
 *   the tree via `DevtoolsContext`.
 *
 *   The provider ALSO owns the inspector context — the toggle
 *   state (`enabled` / `setEnabled`) is co-located here because
 *   both the toolbar and the overlay read it.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
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
import { DevtoolsInspectorContext } from '../../contexts/devtools-inspector.context';
import type { IDevtoolsContextValue } from '../../contexts/devtools-context-value.interface';
import type { IDevtoolsInspectorContextValue } from '../../contexts/devtools-inspector-context-value.interface';
import { useDevtoolsShortcut } from '../../hooks/use-devtools-shortcut.hook';
import { ActionsDevtoolsPanel } from '../../panels/actions.devtools-panel';
import { OverviewDevtoolsPanel } from '../../panels/overview.devtools-panel';

/** Props accepted by {@link DevtoolsProvider}. */
export interface DevtoolsProviderProps {
  /** Children — the rest of the devtools shell tree. */
  readonly children: ReactNode;
}

/**
 * Wraps the shell tree in the devtools context.
 *
 * The provider resolves the registries + services from the
 * surrounding DI container (`@stackra/container/react`'s
 * `useInject` / `useOptionalInject`). It falls back to
 * `DEFAULT_DEVTOOLS_CONFIG` when the module wasn't wired in the
 * container (a real-world case: a consumer mounted `<Devtools />`
 * without adding `DevtoolsModule.forRoot()` to their app module).
 *
 * @example
 * ```tsx
 * <DevtoolsProvider>
 *   <DevtoolsShell />
 * </DevtoolsProvider>
 * ```
 */
export function DevtoolsProvider({ children }: DevtoolsProviderProps): ReactElement | null {
  // Resolve registries — required. If missing we surface a helpful
  // error via the `useInject` throw.
  const panels = useInject<IDevtoolsPanelsRegistry>(DEVTOOLS_REGISTRY);
  const inspector = useInject<IDevtoolsInspectorRegistry>(DEVTOOLS_INSPECTOR_REGISTRY);
  // Resolve the frame-state + analytics services — bound in
  // `DevtoolsModule.forRoot`.
  const frameState = useInject(DevtoolsFrameStateService);
  const analytics = useInject(DevtoolsAnalyticsService);
  // Config is optional — fall back to defaults when missing.
  const rawConfig = useOptionalInject<IDevtoolsModuleOptions>(DEVTOOLS_CONFIG);
  const config = useMemo(() => rawConfig ?? mergeConfig(DEFAULT_DEVTOOLS_CONFIG), [rawConfig]);

  // Snapshot the mount timestamp once — the Overview panel reads
  // this to render session uptime.
  const [mountedAt] = useState<number>(() => Date.now());

  // Inspector toggle state lives here so both the toolbar and the
  // overlay see the same source of truth.
  const [inspectorEnabled, setInspectorEnabled] = useState<boolean>(false);
  const toggleInspector = useCallback(() => setInspectorEnabled((prev) => !prev), []);

  const contextValue = useMemo<IDevtoolsContextValue>(
    () => ({ config, panels, inspector, frameState, analytics, mountedAt }),
    [config, panels, inspector, frameState, analytics, mountedAt]
  );

  const inspectorContextValue = useMemo<IDevtoolsInspectorContextValue>(
    () => ({
      enabled: inspectorEnabled,
      setEnabled: setInspectorEnabled,
      toggle: toggleInspector,
    }),
    [inspectorEnabled, toggleInspector]
  );

  // Register the built-in Overview + Actions panels while the
  // provider is mounted. The panels are React-only so they live
  // here rather than in the core `DevtoolsModule.forRoot()` — this
  // keeps the core subpath React-free.
  //
  // The registry is last-wins per id, so a feature package can
  // still ship its own panel with `id: 'overview'` and it would
  // override the built-in. The instance identities below are
  // stable across renders so we register only once (unmount
  // cleans up).
  useEffect(() => {
    const overview = new OverviewDevtoolsPanel();
    const actions = new ActionsDevtoolsPanel();
    panels.register(overview);
    panels.register(actions);
    return () => {
      panels.unregister(overview.id);
      panels.unregister(actions.id);
    };
  }, [panels]);

  // Bind the keyboard shortcut — toggling the shell's open state.
  // Fires only when `config.shortcut` is truthy; the hook itself
  // no-ops otherwise.
  useDevtoolsShortcut(config.shortcut ?? false, () => {
    frameState.update({ isOpen: !frameState.getSnapshot().isOpen });
  });

  return (
    <DevtoolsContext.Provider value={contextValue}>
      <DevtoolsInspectorContext.Provider value={inspectorContextValue}>
        {children}
      </DevtoolsInspectorContext.Provider>
    </DevtoolsContext.Provider>
  );
}
