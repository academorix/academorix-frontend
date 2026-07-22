/**
 * @file use-devtools-panel.hook.ts
 * @module @stackra/devtools/react/hooks
 * @description Ad-hoc panel-registration hook for app-level panels
 *   that don't need DI.
 *
 *   The hook subscribes on mount and unsubscribes on unmount — so
 *   a component-scoped panel comes and goes with the component
 *   that owns it. Behind the scenes the registry is still the
 *   same one the discovery loader writes to; ordering is arbitrary
 *   (last-wins per id).
 */

import { useEffect, useRef } from "react";
import type { IDevtoolsPanel } from "@stackra/contracts";

import { useDevtoolsContext } from "../use-devtools-context";

/**
 * Register an ad-hoc panel while the calling component is mounted.
 *
 * @param panel - The panel to register. The hook stores a mutable
 *   ref internally so a caller passing a fresh object on every
 *   render doesn't churn the registry.
 *
 * @example
 * ```tsx
 * function MyAppLevelPanel() {
 *   useDevtoolsPanel({
 *     id: 'app',
 *     title: 'App',
 *     category: 'app',
 *     view: {
 *       type: 'component',
 *       render: () => <MyPanel />,
 *     },
 *   });
 *   return null;
 * }
 * ```
 */
export function useDevtoolsPanel(panel: IDevtoolsPanel): void {
  const { panels } = useDevtoolsContext();
  // Track the id so we unregister the correct entry even if the
  // panel object identity changes between renders.
  const idRef = useRef(panel.id);
  idRef.current = panel.id;

  useEffect(() => {
    panels.register(panel);
    const id = idRef.current;
    return () => {
      panels.unregister(id);
    };
    // Registering on every render is expensive AND indistinguishable
    // from a no-op (last-wins with the same id), so scope the
    // effect to the panel id + registry only. Callers that need to
    // refresh a panel (e.g. change its badge) should mutate the
    // instance in place and rely on the badge being a fn.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panels, panel.id]);
}
