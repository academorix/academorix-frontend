/**
 * @file state-devtools-panel-view.interface.ts
 * @module @stackra/state/react/devtools
 * @description Props interface for {@link StateDevtoolsPanelView} —
 *   the React body of the `@stackra/devtools` state panel.
 */

import type { StateRegistry } from '@/core/registries/state.registry';

/**
 * Props accepted by {@link StateDevtoolsPanelView}.
 */
export interface StateDevtoolsPanelViewProps {
  /**
   * The {@link StateRegistry} instance — optional so the view
   * renders an empty-state card when `StateModule.forRoot()` isn't
   * wired. When present the view subscribes to per-store snapshots
   * via `useSyncExternalStore` for tearing-free reads.
   */
  readonly registry?: StateRegistry;
}
